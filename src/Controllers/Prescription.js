import MedicalExaminationSlip from "../Models/MedicalExaminationSlip.js";
import User from "../Models/User.js";
import Prescription from "../Models/Prescription.js";
import Medicine from "../Models/Medicine.js";
import PrescriptionValidate from "../Schemas/Prescription.js";
import generateNextId from "../Utils/generateNextId.js";
import handleTotalOrder from "../Utils/handleTotalOrder.js";
import Order from "../Models/Order.js";

// get all Prescription
export const getAllPrescription = async (req, res) => {
  const {
    _page = 1,
    _limit = 10,
    _sort = "createdAt",
    _order = "desc",
    _status,
    _doctorId,
    search,
  } = req.query;

  const options = {
    page: _page,
    limit: _limit,
    sort: {
      [_sort]: _order === "asc" ? 1 : -1,
    },
    populate: [
      { path: "doctorId", select: "_id name phone" },
      {
        path: "customerId",
        select:
          "_id name province district commune detailedAddress phone dateOfBirth gender email",
      },
      { path: "medicalExaminationSlipId" },
      { path: "medicines.medicineId", select: "_id name price" },
    ],
  };

  try {
    let query = {};

    const searchRegex = new RegExp(search, "i");
    if (search && search.trim() !== "") {
      query.$or = [
        {
          "customer._id": { $regex: searchRegex },
        },
        {
          "customer.name": { $regex: searchRegex },
        },
        {
          "customer.phone": { $regex: searchRegex },
        },
        {
          "doctor._id": { $regex: searchRegex },
        },
        {
          "doctor.name": { $regex: searchRegex },
        },
        {
          "doctor.phone": { $regex: searchRegex },
        },
        { medicalExaminationSlipId: { $regex: searchRegex } },
        { _id: { $regex: searchRegex } },
        { doctorId: { $regex: searchRegex } },
      ];
    }

    if (_status) {
      query.status = _status;
    }

    if (_doctorId) {
      query.doctorId = _doctorId;
    }

    const prescriptions = await Prescription.paginate(query, options);

    if (!prescriptions) {
      return res.status(400).json({
        message: "Không tìm thấy danh sách Kê đơn!",
      });
    }

    const pojoPrescriptions = prescriptions.docs.map((doc) => doc.toObject());

    pojoPrescriptions.forEach((doc) => {
      delete doc.customer;
      delete doc.doctor;
    });

    return res.status(200).json({
      message: "Lấy danh sách Kê đơn thành công!",
      prescriptions: {
        ...prescriptions,
        docs: pojoPrescriptions,
      },
    });
  } catch (error) {
    return res.status(404).json({
      message: `Đã xảy ra lỗi: ${error.message}`,
    });
  }
};

// get all Prescription by medicalExaminationSlipId
export const getAllPresbyExaminationId = async (req, res) => {
  const { medicalExaminationSlipId } = req.params;
  const {
    _page = 1,
    _limit = 10,
    _sort = "createdAt",
    _order = "desc",
    _status,
    _doctorId,
    search,
  } = req.query;

  const options = {
    page: _page,
    limit: _limit,
    sort: {
      [_sort]: _order === "asc" ? 1 : -1,
    },
    populate: [
      { path: "doctorId", select: "_id name phone" },
      {
        path: "customerId",
        select:
          "_id name province district commune detailedAddress phone dateOfBirth gender email",
      },
      { path: "medicalExaminationSlipId" },
      { path: "medicines.medicineId", select: "_id name price" },
    ],
  };

  try {
    let query = {
      medicalExaminationSlipId: medicalExaminationSlipId,
    };
    const searchRegex = new RegExp(search, "i");
    if (search && search.trim() !== "") {
      query.$or = [
        {
          "customer._id": { $regex: searchRegex },
        },
        {
          "customer.name": { $regex: searchRegex },
        },
        {
          "customer.phone": { $regex: searchRegex },
        },
        {
          "doctor._id": { $regex: searchRegex },
        },
        {
          "doctor.name": { $regex: searchRegex },
        },
        {
          "doctor.phone": { $regex: searchRegex },
        },
        { medicalExaminationSlipId: { $regex: searchRegex } },
        { _id: { $regex: searchRegex } },
        { doctorId: { $regex: searchRegex } },
      ];
    }

    if (_doctorId) {
      query.doctorId = _doctorId;
    }

    const prescriptions = await Prescription.paginate(query, options);

    if (!prescriptions) {
      return res.status(400).json({
        message: "Không tìm thấy danh sách Kê đơn theo Phiếu khám!",
      });
    }

    const pojoPrescriptions = prescriptions.docs.map((doc) => doc.toObject());

    pojoPrescriptions.forEach((doc) => {
      delete doc.customer;
      delete doc.doctor;
    });

    return res.status(200).json({
      message: "Lấy danh sách Kê đơn theo Phiếu khám thành công!",
      prescriptions: {
        ...prescriptions,
        docs: pojoPrescriptions,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: `Đã xảy ra lỗi: ${error.message}`,
    });
  }
};

// get one Prescription
export const getOnePrescription = async (req, res) => {
  const { id } = req.params;
  try {
    const prescription = await Prescription.findById(id)
      .populate("doctorId")
      .populate("medicalExaminationSlipId")
      .populate({
        path: "customerId",
        select:
          "_id name province district commune detailedAddress phone dateOfBirth gender email",
      })
      .populate({ path: "medicines.medicineId", select: "_id name price" });

    if (!prescription) {
      return res.status(400).json({
        message: "Không tìm thấy dữ liệu Kê đơn!",
      });
    }

    return res.status(200).json({
      message: "Tìm dữ liệu Kê đơn thành công!",
      prescription,
    });
  } catch (error) {
    return res.status(404).json({
      message: `Đã xảy ra lỗi: ${error.message}`,
    });
  }
};

// create new Prescription
export const createPrescription = async (req, res) => {
  const { doctorId, medicalExaminationSlipId, medicines } = req.body;
  try {
    const { error } = PrescriptionValidate.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      const errArr = error.details.map((err) => err.message);
      return res.status(400).json({
        message: errArr,
      });
    }

    // Kiểm tra số lượng thuốc
    for (const med of medicines) {
      const medicine = await Medicine.findById(med.medicineId);

      if (
        !medicine ||
        medicine.quantity <= 0 ||
        medicine.quantity < med.quantity
      ) {
        return res.status(400).json({
          message: `Thuốc ${medicine.name} đã hết hoặc số lượng không đủ!`,
        });
      }
    }

    // create customer
    let customerId = "";
    let customer = "";
    const medicalExaminationSlip = await MedicalExaminationSlip.findById(
      medicalExaminationSlipId
    );

    if (
      medicalExaminationSlip &&
      medicalExaminationSlip.customer &&
      medicalExaminationSlip.customerId
    ) {
      customerId = medicalExaminationSlip.customerId;
      customer = medicalExaminationSlip.customer;
    }
    // create doctor
    let doctor = "";
    const user = await User.findById(doctorId);
    if (user) {
      doctor = {
        _id: user._id,
        name: user.name,
        phone: user.phone,
      };
    }

    const lastPrescription = await Prescription.findOne(
      {},
      {},
      { sort: { _id: -1 } }
    );
    const prescriptionId = generateNextId(
      lastPrescription ? lastPrescription._id : null,
      "KD"
    );

    const prescription = await Prescription.create({
      ...req.body,
      _id: prescriptionId,
      customer,
      customerId,
      doctor,
    });

    // Cập nhật lại thuốc tương ứng
    if (
      prescription &&
      prescription.medicines &&
      prescription.medicines.length
    ) {
      prescription.medicines.map(async (med) => {
        const medi = await Medicine.findById(med.medicineId);
        if (medi.quantity - med.quantity == 0) {
          return await Medicine.findByIdAndUpdate(med.medicineId, {
            status: "empty",
            quantity: 0,
          });
        }
        return await Medicine.findByIdAndUpdate(med.medicineId, {
          quantity: medi.quantity - med.quantity,
        });
      });
    }

    if (!prescription) {
      return res.status(400).json({
        message: "Không có dữ liệu Kê đơn để thêm!",
      });
    }

    prescription.customer = undefined;
    prescription.doctor = undefined;
    return res.status(200).json({
      message: "Kê đơn thành công!",
      prescription,
    });
  } catch (error) {
    return res.status(404).json({
      message: `Đã xảy ra lỗi: ${error.message}`,
    });
  }
};

// update new Prescription
export const updatePrescription = async (req, res) => {
  const { status, paymentStatus, paymentMethod, medicines, note, totalAmount } =
    req.body;
  const { id } = req.params;
  try {
    const prescription = await Prescription.findById(id);
    console.log(prescription);
    if (!prescription) {
      return res.status(400).json({
        message: "Không tìm thấy Kê đơn cần cập nhật",
      });
    }

    if (prescription.status === 3) {
      return res.status(400).json({
        message: "Kê đơn này đã hủy! Không thể cập nhật",
      });
    }

    // Kiểm tra điều kiện isComplete
    if (
      (prescription && prescription.status === 2) ||
      (prescription && prescription.paymentStatus === 1)
    ) {
      return res.status(400).json({
        message: "Phiếu Kê đơn này đã hoàn thành, không thể cập nhật!",
      });
    }
    if (medicines) {
      for (const med of medicines) {
        const medicineId = med.medicineId;
        const quantity = med.quantity;

        const medicine = await Medicine.findById(medicineId);

        // Lưu trữ giá trị cũ của số lượng thuốc
        const oldQuantity = prescription.medicines.find(
          (m) => m.medicineId === medicineId
        )?.quantity;

        if (
          medicine.quantity < 0 ||
          medicine.quantity + oldQuantity < med.quantity
        ) {
          return res.status(400).json({
            message: `Thuốc ${medicine.name} đã hết hoặc số lượng không đủ!`,
          });
        }

        if (oldQuantity) {
          medicine.quantity = medicine.quantity + oldQuantity - quantity;
        } else {
          medicine.quantity = medicine.quantity - quantity;
        }
        if (medicine.quantity == 0) {
          medicine.status = "empty";
        }
        //

        // Lưu lại Medicine đã cập nhật
        await medicine.save();
      }
    }

    const prescriptionUpdated = await Prescription.findByIdAndUpdate(
      id,
      { ...req.body },
      {
        new: true,
      }
    );
    return res.status(200).json({
      message: "Cập nhật Kê đơn thành công!",
      prescription: prescriptionUpdated,
      success: true,
    });
  } catch (error) {
    return res.status(404).json({
      message: `Đã xảy ra lỗi: ${error.message}`,
    });
  }
};

// delete Prescription
export const deletePrescription = async (req, res) => {
  const { id } = req.params;
  try {
    const prescription = await Prescription.findById(id);

    if (!prescription) {
      return res.status(400).json({
        message: "Không tìm thấy Kê đơn!",
      });
    } else if (
      (prescription && prescription.status === 2) ||
      (prescription && prescription.paymentStatus === 1)
    ) {
      return res.status(400).json({
        message: "Phiếu Kê đơn này đã hoàn thành, không thể xóa!",
      });
    } else if (prescription && prescription.status === 3) {
      return res.status(400).json({
        message: "Kê đơn này đã hủy! Không thể cập nhật",
      });
    }

    // Cập nhật lại thuốc tương ứng
    if (
      prescription &&
      prescription.medicines &&
      prescription.medicines.length
    ) {
      const medicinesUpdated = prescription.medicines.map((med) => ({
        updateOne: {
          filter: { _id: med.medicineId },
          update: { $inc: { quantity: +med.quantity } },
        },
      }));

      if (medicinesUpdated.length > 0) {
        await Medicine.bulkWrite(medicinesUpdated);
      }
    }

    await Prescription.findByIdAndDelete(prescription._id);

    return res.status(200).json({
      message: "Xóa Kê đơn thành công!",
    });
  } catch (error) {
    return res.status(500).json({
      message: `Đã xảy ra lỗi: ${error.message}!`,
    });
  }
};
