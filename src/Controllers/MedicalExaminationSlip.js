import Customer from "../Models/Customer.js";
import MedicalExaminationSlip from "../Models/MedicalExaminationSlip.js";
import ServiceByExamination from "../Models/ServiceByExamination.js";
import medicineExaminationSlipValidate from "../Schemas/MedicalExaminationSlip.js";
import generateNextId, { generateNextNumber } from "../Utils/generateNextId.js";
import { sendMessageToDevices } from "../sendMessageToDevices.js";
import moment from "moment/moment.js";
import Notification from "../Models/Notification.js";
import { getNotifyTokens } from "./NotifyToken.js";
import Role from "../Models/Role.js";
import {
  notifyMailBooking,
  notifyMailExamDone,
} from "../configs/nodemailer.js";
import dotenv from "dotenv";
dotenv.config();

export const getAllExamination = async (req, res) => {
  try {
    const {
      _page = 1,
      _limit = 10,
      _sort = "createdAt",
      _order = "desc",
      status,
      search,
      doctorId,
      staffId,
      clinicId,
      day_booking,
      day_welcome,
      day_waiting,
      day_done,
      day_running,
      day_cancel,
    } = req.query;
    let query = {};
    const options = {
      page: _page,
      limit: _limit,

      sort: {
        [_sort]: _order === "asc" ? 1 : -1,
      },
      populate: [
        {
          path: "customerId",
          select: "name phone _id dateOfBirth gender email note",
        },
        { path: "doctorId", select: "_id name email phone" },
        { path: "staffId", select: "_id name email phone" },
        "clinicId",
      ],
    };
    const searchRegex = new RegExp(search, "i");
    if (search && search.trim() !== "") {
      query.$or = [
        {
          "customer.phone": { $regex: searchRegex },
        },
        { "customer.name": { $regex: searchRegex } },
        { customerId: { $regex: searchRegex } },
        { _id: { $regex: searchRegex } },
      ];
    }
    if (status) {
      query.status = status;
    }

    if (day_booking) {
      const queryDate = new Date(day_booking);
      const startOfDay = new Date(
        queryDate.getFullYear(),
        queryDate.getMonth(),
        queryDate.getDate()
      );
      const endOfDay = new Date(
        queryDate.getFullYear(),
        queryDate.getMonth(),
        queryDate.getDate() + 1
      );

      query.day_booking = {
        $gte: startOfDay.toISOString(),
        $lt: endOfDay.toISOString(),
      };
    }
    if (day_welcome) {
      const queryDate = new Date(day_welcome);
      const startOfDay = new Date(
        queryDate.getFullYear(),
        queryDate.getMonth(),
        queryDate.getDate()
      );
      const endOfDay = new Date(
        queryDate.getFullYear(),
        queryDate.getMonth(),
        queryDate.getDate() + 1
      );

      query.day_welcome = {
        $gte: startOfDay.toISOString(),
        $lt: endOfDay.toISOString(),
      };
    }
    if (day_waiting) {
      const queryDate = new Date(day_waiting);
      const startOfDay = new Date(
        queryDate.getFullYear(),
        queryDate.getMonth(),
        queryDate.getDate()
      );
      const endOfDay = new Date(
        queryDate.getFullYear(),
        queryDate.getMonth(),
        queryDate.getDate() + 1
      );

      query.day_waiting = {
        $gte: startOfDay.toISOString(),
        $lt: endOfDay.toISOString(),
      };
    }

    if (day_done) {
      query.day_done = day_done;
    }
    if (day_running) {
      query.day_running = day_running;
    }
    if (day_cancel) {
      query.day_cancel = day_cancel;
    }

    if (doctorId) {
      query.doctorId = doctorId;
    }
    if (staffId) {
      query.staffId = staffId;
    }
    if (clinicId) {
      query.clinicId = clinicId;
    }

    const medicalExaminationSlips = await MedicalExaminationSlip.paginate(
      query,
      options
    );
    if (!medicalExaminationSlips) {
      return res.status(404).json({
        message: "Không tìm thấy phiếu khám nào!",
      });
    }
    // Chuyển đổi tài liệu kết quả thành plain JavaScript objects (POJO)
    const pojoMedicalExaminationSlips = medicalExaminationSlips.docs.map(
      (doc) => doc.toObject()
    );

    // Loại bỏ trường "customer" từ POJO
    pojoMedicalExaminationSlips.forEach((doc) => {
      delete doc.customer;
    });
    return res.json({
      message: "Lấy danh sách phiếu khám thành công!",
      medicalExaminationSlips: {
        ...medicalExaminationSlips,
        docs: pojoMedicalExaminationSlips,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi khi lấy danh sách khách hàng: " + error.message,
    });
  }
};

export const createMedicalExaminationSlip = async (req, res) => {
  try {
    const roleAuth = await Role.findById(req.user.role);
    if (roleAuth.roleNumber === 0 || roleAuth.roleNumber === 2) {
      // Validate form
      const { error } = medicineExaminationSlipValidate.validate(req.body, {
        abortEarly: false,
      });

      if (error) {
        const errArr = error.details.map((err) => err.message);
        return res.status(401).json({
          message: errArr,
        });
      }

      // Kiểm tra xem có mã ID được cung cấp hay không
      let examinationId = req.body._id;
      const customerId = req.body.customerId;
      const notifyTokens = await getNotifyTokens();
      // Tạo mã chờ khám

      if (!examinationId || examinationId === "") {
        // Nếu không có mã ID, tạo mã mới bằng cách kết hợp mã KH và mã tự sinh
        const lastExamination = await MedicalExaminationSlip.findOne(
          {},
          {},
          { sort: { _id: -1 } }
        );
        examinationId = generateNextId(
          lastExamination ? lastExamination._id : null,
          "PK"
        );
      } else {
        const isExiting = await MedicalExaminationSlip.findById(examinationId);
        if (isExiting) {
          return res.status(400).json({
            message: "Mã bệnh nhân đã tồn tại",
          });
        }
      }

      const customerData = await Customer.findById(customerId);
      const customer = {
        _id: customerData._id,
        name: customerData.name,
        phone: customerData.phone,
      };
      const data = req.body;
      const { examinationServiceId, ...rest } = data;
      if (req.body.status == "recetion") {
        const lastWaitingCode = await MedicalExaminationSlip.findOne(
          {},
          {},
          { sort: { _id: -1 } }
        );
        console.log(
          "🚀 ~ file: MedicalExaminationSlip.js:234 ~ createMedicalExaminationSlip ~ lastWaitingCode:",
          lastWaitingCode
        );
        const waitingCode = generateNextNumber(
          lastWaitingCode ? lastWaitingCode.waitingCode : null
        );
        const examination = await MedicalExaminationSlip.create({
          ...rest,
          customer,
          id: examinationId,
          waitingCode,
          day_welcome: new Date().toISOString(),
        });

        const services = examinationServiceId;
        for (let i = 0; i < services?.length; i++) {
          const lastRecord = await ServiceByExamination.findOne().sort({
            _id: -1,
          });
          let newId = generateNextId(lastRecord ? lastRecord._id : null, "DVK");

          const serviceByExamination = new ServiceByExamination({
            examinationId: examination._id,
            service_examination: services[i],
            doctorId: req.body.doctorId,
            customerId: req.body.customerId,
            staffId: req.body.staffId,
            clinicId: req.body.clinicId,
            id: newId,
            paymentStatus: req.body.paymentStatus,
          });
          await serviceByExamination.save();
        }
        return res.status(200).json({
          message: "Tạo phiếu khám thành công",
          examination,
        });
      } else if (req.body.status === "booking") {
        const lastWaitingCode = await MedicalExaminationSlip.findOne(
          {},
          {},
          { sort: { _id: -1 } }
        );
        console.log(
          "🚀 ~ file: MedicalExaminationSlip.js:278 ~ createMedicalExaminationSlip ~ lastWaitingCode:",
          lastWaitingCode
        );
        const waitingCode = generateNextNumber(
          lastWaitingCode ? lastWaitingCode.waitingCode : null
        );
        console.log(
          "🚀 ~ file: MedicalExaminationSlip.js:277 ~ createMedicalExaminationSlip ~ waitingCode:",
          waitingCode
        );
        const examination = await MedicalExaminationSlip.create({
          ...rest,
          customer,
          id: examinationId,
          waitingCode,
          day_booking: req.body.day_booking,
        });

        if (notifyTokens.length) {
          await sendMessageToDevices(
            notifyTokens,
            `Phòng khám Medipro`,
            `Khách hàng ${customer.name}-${
              customer.phone
            } đã đặt lịch khám vào lúc ${moment(examination.createdAt).format(
              "HH:mm DD/MM/yyyy"
            )}`,
            `${process.env.RECEPTION_LINK}/${examination._id}/view`
          );
        }

        // Gửi mail thông báo cho khách hàng đã đặt lịch thành công
        await notifyMailBooking(
          customerData.email,
          moment(examination.day_booking).format("HH:mm DD/MM/yyyy")
        ).catch((error) => console.log("Error send mail:", error));

        // Tạo mới thông báo model Notification
        const lastNotification = await Notification.findOne(
          {},
          {},
          { sort: { _id: -1 } }
        );
        const notificationId = generateNextId(
          lastNotification ? lastNotification._id : null,
          "TB"
        );

        const newNotification = new Notification({
          _id: notificationId,
          categoryNotification: "booking",
          customerId: customerData._id,
          customer: customer,
          examinationId: examination._id,
          doctorId: examination.doctorId || "",
          content: `Khách hàng ${customer.name}-${
            customer.phone
          } đã đặt lịch khám vào lúc ${moment(examination.createdAt).format(
            "HH:mm DD/MM/yyyy"
          )}`,
          link: `${process.env.RECEPTION_LINK}/${examination._id}/view`,
          status: 0,
        });

        await newNotification.save();

        return res.status(200).json({
          message: "Đặt lịch khám thành công!",
          examination,
        });
      } else {
        // const examination = await MedicalExaminationSlip.create({
        //   ...rest,
        //   customer,
        //   id: examinationId,
        //   waitingCode,
        // });
        // await Customer.findByIdAndUpdate(customerId, {
        //   $addToSet: { examination_history: examination._id },
        // });
        return res.status(400).json({
          message:
            "Trạng thái phiếu khám không hợp lệ! Chỉ có thể chọn trạng thái Đặt lịch hoặc Tiếp đón",
        });
      }
    } else {
      return res.status(403).json({
        message: "Bạn không có quyền thực hiện hành động này!",
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export const getOne = async (req, res) => {
  try {
    const examination = await MedicalExaminationSlip.findById(
      req.params.id
    ).populate([
      "customerId",
      "doctorId",
      "staffId",
      "clinicId",
      { path: "cancel_requester", select: "name" },
    ]);
    console.log(
      "🚀 ~ file: MedicalExaminationSlip.js:387 ~ getOne ~ examination:",
      examination
    );
    if (!examination) {
      return res.status(400).json({
        message: "Phiếu khám không tồn tại!",
      });
    }
    return res.json({
      message: "Lấy phiếu khám thành công!",
      examination,
    });
  } catch (error) {
    return res.status(404).json({
      message: error.message,
    });
  }
};

export const deleteExamination = async (req, res) => {
  try {
    const examination = await MedicalExaminationSlip.findByIdAndRemove(
      req.params.id
    );
    if (!examination) {
      return res.status(404).json({
        message: "Phiếu khám không tồn tại!",
      });
    }
    await Customer.findByIdAndUpdate(examination.customerId, {
      $pull: {
        examination_history: examination._id,
      },
    });
    return res.json({
      message: "Xóa phiếu khám thành công!",
      examination,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi khi xóa phiếu khám: " + error.message,
    });
  }
};

export const updateExamination = async (req, res) => {
  const { status } = req.body;
  try {
    const id = req.params.id;
    const services = req.body.examinationServiceId;
    const user = req.user;

    // Validate form
    const { error } = medicineExaminationSlipValidate.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const errArr = error.details.map((err) => err.message);
      return res.status(401).json({
        message: errArr,
      });
    }

    // Tìm ra Vai trò của User
    const { roleNumber } = await Role.findById({ _id: user.role });
    if (
      (roleNumber === 1 && status == "booking") ||
      (roleNumber === 1 && status === "recetion") ||
      (roleNumber === 1 && status === "waiting") ||
      (roleNumber === 1 && status === "cancel_schedule") ||
      (roleNumber === 3 && status == "booking") ||
      (roleNumber === 3 && status == "recetion") ||
      (roleNumber === 3 && status == "waiting") ||
      (roleNumber === 3 && status == "running") ||
      (roleNumber === 3 && status == "done") ||
      (roleNumber === 3 && status == "cancel_schedule") ||
      (roleNumber === 2 && status == "running" && status == "done")
    ) {
      return res.status(403).json({
        message: "Bạn không có quyền thực hiện hành động này!",
      });
    }

    const dataExam = await MedicalExaminationSlip.findById(id);
    const notifyTokens = await getNotifyTokens();

    // Nếu trạng thái trước khi cập nhật của Phiếu khám đã Hủy
    if (dataExam.status === "cancel") {
      return res.status(400).json({
        message: "Phiếu khám này đã hủy, không thể cập nhật",
      });
    }

    // Nếu trạng thái trước khi cập nhật của Lịch khám đã Hủy
    if (dataExam.status === "cancel_schedule") {
      return res.status(400).json({
        message: "Lịch khám này đã hủy, không thể cập nhật",
      });
    }

    // Nếu cập nhật lại customerId (Cập nhật Khách hàng khác trong Phiếu khám)
    if (req.body.customerId && dataExam?.customerId !== req.body.customerId) {
      const customerData = await Customer.findById(req.body.customerId);
      const customer = {
        _id: customerData._id,
        name: customerData.name,
        phone: customerData.phone,
      };

      // Nếu không phải trạng thái Hủy và có Dịch vụ khám
      if (
        (services && status !== "cancel") ||
        (services && status !== "cancel_schedule")
      ) {
        const examination = await MedicalExaminationSlip.findByIdAndUpdate(id, {
          ...req.body,
          customer,
        });

        for (let i = 0; i < services?.length; i++) {
          const lastRecord = await ServiceByExamination.findOne().sort({
            _id: -1,
          });
          let newId = generateNextId(lastRecord ? lastRecord._id : null, "DVK");
          const serviceByExamination = new ServiceByExamination({
            examinationId: examination._id,
            service_examination: services[i],
            doctorId: req.body.doctorId,
            customerId: req.body.customerId,
            staffId: req.body.staffId,
            clinicId: req.body.clinicId,
            id: newId,
            paymentStatus: req.body.paymentStatus,
          });
          await serviceByExamination.save();
        }

        // Gửi mail thông báo khám nếu status là "done"
        if (status === "done") {
          await notifyMailExamDone(customerData.email, examination._id).catch(
            (error) => console.log("Error send mail:", error)
          );

          await Customer.findByIdAndUpdate(examination.customerId, {
            $addToSet: { examination_history: examination._id },
          });
        }

        return res.json({
          message: "Cập nhật Phiếu khám thành công!",
          examination,
        });

        // Nếu là trạng thái Hủy
      }
      // Nếu status = cancel ( Trạng thái là Hủy Phiếu Khám)
      else if (status === "cancel") {
        const examination = await MedicalExaminationSlip.findByIdAndUpdate(
          id,
          {
            ...req.body,
            cancelRequester: req.body.cancel_requester,
            day_cancel: new Date().toISOString(),
          },
          { new: true }
        );
        // hủy tất cả các dịch vụ
        await ServiceByExamination.updateMany(
          { examinationId: id },
          { status: "canceled" }
        );
        const customerData = await Customer.findById(examination.customerId);

        // Gửi thông báo đã hủy Lịch
        if (notifyTokens.length) {
          await sendMessageToDevices(
            notifyTokens,
            `Phòng khám Medipro`,
            `Phiếu khám ${examination._id} của khách hàng ${
              customerData.name
            }-${customerData.phone} đã bị hủy vào ${moment(
              examination.updatedAt
            ).format("HH:mm DD/MM/yyyy")}`,
            `${process.env.EXAMINATION_LINK}/${examination._id}/view`
          );
        }

        // Tạo mới thông báo model Notification
        const lastNotification = await Notification.findOne(
          {},
          {},
          { sort: { _id: -1 } }
        );
        const notificationId = generateNextId(
          lastNotification ? lastNotification._id : null,
          "TB"
        );

        const newNotification = new Notification({
          _id: notificationId,
          categoryNotification: "cancel_examination",
          customerId: customerData._id,
          customer: {
            _id: customerData._id,
            name: customerData.name,
            phone: customerData.phone,
          },
          content: `Phiếu khám ${examination._id} của khách hàng ${
            customerData.name
          }-${customerData.phone} đã bị hủy vào ${moment(
            examination.updatedAt
          ).format("HH:mm DD/MM/yyyy")}`,
          examinationId: examination._id,
          doctorId: examination.doctorId || "",
          link: `/examination/${examination._id}/view`,
          status: 0,
        });

        await newNotification.save();

        return res.json({
          message: "Hủy Khám thành công!",
          examination,
        });
      }

      // Nếu status = cancel_schedule ( Trạng thái là Hủy Lịch khám)
      else if (status === "cancel_schedule") {
        const examination = await MedicalExaminationSlip.findByIdAndUpdate(
          id,
          {
            ...req.body,
            day_cancel: new Date().toISOString(),
          },
          { new: true }
        );

        const customerData = await Customer.findById(examination.customerId);

        // Gửi thông báo đã hủy Lịch
        if (notifyTokens.length) {
          await sendMessageToDevices(
            notifyTokens,
            `Phòng khám Medipro`,
            `Lịch khám ${examination._id} của khách hàng ${customerData.name}-${
              customerData.phone
            } đã bị hủy vào ${moment(examination.updatedAt).format(
              "HH:mm DD/MM/yyyy"
            )}`,
            `${process.env.RECEPTION_LINK}/${examination._id}/view`
          );
        }

        // Tạo mới thông báo model Notification
        const lastNotification = await Notification.findOne(
          {},
          {},
          { sort: { _id: -1 } }
        );
        const notificationId = generateNextId(
          lastNotification ? lastNotification._id : null,
          "TB"
        );

        const newNotification = new Notification({
          _id: notificationId,
          categoryNotification: "cancel_schedule",
          customerId: customerData._id,
          customer: {
            _id: customerData._id,
            name: customerData.name,
            phone: customerData.phone,
          },
          content: `Lịch khám ${examination._id} của khách hàng ${
            customerData.name
          }-${customerData.phone} đã bị hủy vào ${moment(
            examination.updatedAt
          ).format("HH:mm DD/MM/yyyy")}`,
          examinationId: examination._id,
          doctorId: examination.doctorId || "",
          link: `/reception/${examination._id}/view`,
          status: 0,
        });

        await newNotification.save();

        return res.json({
          message: "Hủy Lịch khám thành công!",
          examination,
        });
      }
      // Nếu không có Dịch vụ khám và cũng không phải trạng thái Hủy lịch hoặc Hủy khám
      else {
        const examination = await MedicalExaminationSlip.findByIdAndUpdate(
          id,
          {
            ...req.body,
          },
          { new: true }
        );

        // Gửi mail thông báo khám nếu status là "done"
        if (status === "done") {
          await notifyMailExamDone(customerData.email, examination._id).catch(
            (error) => console.log("Error send mail:", error)
          );

          await Customer.findByIdAndUpdate(customerData._id, {
            $addToSet: { examination_history: examination._id },
          });
        }

        return res.json({
          message: "Cập nhật phiếu khám thành công!",
          examination,
        });
      }
    }

    // Nếu không cập nhật lại customerId (Cập nhật Khách hàng khác trong Phiếu khám)
    else {
      // Nếu không phải trạng thái Hủy và có Dịch vụ khám
      if (services && status !== "cancel") {
        const examination = await MedicalExaminationSlip.findByIdAndUpdate(
          id,
          {
            ...req.body,
          },
          { new: true }
        ).populate([{ path: "customerId" }]);

        const customerData = examination?.customerId;

        for (let i = 0; i < services?.length; i++) {
          const lastRecord = await ServiceByExamination.findOne().sort({
            _id: -1,
          });
          let newId = generateNextId(lastRecord ? lastRecord._id : null, "DVK");
          const serviceByExamination = new ServiceByExamination({
            examinationId: examination._id,
            service_examination: services[i],
            doctorId: req.body.doctorId,
            customerId: req.body.customerId,
            staffId: req.body.staffId,
            clinicId: req.body.clinicId,
            id: newId,
            paymentStatus: req.body.paymentStatus,
          });
          await serviceByExamination.save();
        }

        // Gửi mail thông báo khám nếu status là "done"
        if (status === "done") {
          await notifyMailExamDone(customerData.email, examination._id).catch(
            (error) => console.log("Error send mail:", error)
          );
        }

        return res.json({
          message: "Cập nhật phiếu khám thành công",
          examination,
        });
      }
      // Nếu trạng thái là cancel (Hủy phiếu khám)
      else if (status === "cancel") {
        const examination = await MedicalExaminationSlip.findByIdAndUpdate(
          id,
          {
            ...req.body,
            day_cancel: new Date().toISOString(),
          },
          { new: true }
        ).populate([{ path: "customerId" }]);

        await ServiceByExamination.updateMany(
          { examinationId: id },
          { status: "canceled" }
        );

        const customerData = examination.customerId;

        // Gửi thông báo đã hủy Lịch
        if (notifyTokens.length) {
          await sendMessageToDevices(
            notifyTokens,
            `Phòng khám Medipro`,
            `Phiếu khám ${examination._id} của khách hàng ${
              customerData.name
            }-${customerData.phone} đã bị hủy vào ${moment(
              examination.updatedAt
            ).format("HH:mm DD/MM/yyyy")}`,
            `${process.env.EXAMINATION_LINK}/${examination._id}/view`
          );
        }

        // Tạo mới thông báo model Notification

        const lastNotification = await Notification.findOne(
          {},
          {},
          { sort: { _id: -1 } }
        );
        const notificationId = generateNextId(
          lastNotification ? lastNotification._id : null,
          "TB"
        );

        const newNotification = new Notification({
          _id: notificationId,
          categoryNotification: "cancel_examination",
          customerId: customerData._id,
          customer: {
            _id: customerData._id,
            name: customerData.name,
            phone: customerData.phone,
          },
          content: `Phiếu khám ${examination._id} của khách hàng ${
            customerData.name
          }-${customerData.phone} đã bị hủy vào ${moment(
            examination.updatedAt
          ).format("HH:mm DD/MM/yyyy")}`,
          examinationId: examination._id,
          doctorId: examination.doctorId || "",
          link: `/examination/${examination._id}/view`,
          status: 0,
        });

        await newNotification.save();

        return res.json({
          message: "Hủy Phiếu khám thành công!",
          examination,
        });
      }

      // Nếu trạng thái là cancel_schedule (Hủy Lịch  khám)
      else if (status === "cancel_schedule") {
        const examination = await MedicalExaminationSlip.findByIdAndUpdate(
          id,
          {
            ...req.body,
            day_cancel: new Date().toISOString(),
          },
          { new: true }
        ).populate([{ path: "customerId" }]);

        const customerData = examination.customerId;

        // Gửi thông báo đã hủy Lịch
        if (notifyTokens.length) {
          await sendMessageToDevices(
            notifyTokens,
            `Phòng khám Medipro`,
            `Lịch khám ${examination._id} của khách hàng ${customerData.name}-${
              customerData.phone
            } đã bị hủy vào ${moment(examination.updatedAt).format(
              "HH:mm DD/MM/yyyy"
            )}`,
            `${process.env.RECEPTION_LINK}/${examination._id}/view`
          );
        }

        // Tạo mới thông báo model Notification

        const lastNotification = await Notification.findOne(
          {},
          {},
          { sort: { _id: -1 } }
        );
        const notificationId = generateNextId(
          lastNotification ? lastNotification._id : null,
          "TB"
        );

        const newNotification = new Notification({
          _id: notificationId,
          categoryNotification: "cancel_schedule",
          customerId: customerData._id,
          customer: {
            _id: customerData._id,
            name: customerData.name,
            phone: customerData.phone,
          },
          content: `Lịch khám ${examination._id} của khách hàng ${
            customerData.name
          }-${customerData.phone} đã bị hủy vào ${moment(
            examination.updatedAt
          ).format("HH:mm DD/MM/yyyy")}`,
          examinationId: examination._id,
          doctorId: examination.doctorId || "",
          link: `/reception/${examination._id}/view`,
          status: 0,
        });

        await newNotification.save();

        return res.json({
          message: "Hủy Lịch khám thành công!",
          examination,
        });
      }
      // Nếu không có Dịch vụ khám và cũng không phải trạng thái Hủy lịch hoặc Hủy khám
      else {
        // const customerData = await Customer.findById(req.body.customerId);
        const examination = await MedicalExaminationSlip.findByIdAndUpdate(
          id,
          req.body,
          { new: true }
        ).populate([{ path: "customerId" }]);

        // Gửi mail thông báo khám nếu status là "done"
        if (status === "done") {
          await Customer.findByIdAndUpdate(examination.customerId, {
            $addToSet: { examination_history: examination._id },
          });

          await notifyMailExamDone(
            examination.customerId?.email,
            examination._id
          ).catch((error) => console.log("Error send mail:", error));
        }

        return res.json({
          message: "Cập nhật phiếu khám thành công!",
          examination,
        });
      }
    }
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi khi cập nhật phiếu khám: " + error.message,
    });
  }
};
