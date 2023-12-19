import Order from "../Models/Order.js";
import Customer from "../Models/Customer.js";
import OrderValidate from "../Schemas/Order.js";
import generateNextId from "../Utils/generateNextId.js";
import Medicine from "../Models/Medicine.js";

export const getAllOrder = async (req, res) => {
  const {
    _page = 1,
    _limit = 10,
    _sort = "createdAt",
    _order = "desc",
    status,
    orderType,
    paymentStatus,
    sellerId,
    search,
    createdAt,
  } = req.query;

  const options = {
    page: _page,
    limit: _limit,
    sort: {
      [_sort]: _order === "asc" ? 1 : -1,
    },
    populate: [
      { path: "customerId", select: "_id name phone" },
      { path: "sellerId", select: "_id name phone" },
      { path: "prescriptionId" },
      { path: "medicines.medicineId", select: "_id name price image" },
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
        { _id: { $regex: searchRegex } },
      ];
    }
    if (createdAt) {
      const queryDate = new Date(createdAt);
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

      query.createdAt = {
        $gte: startOfDay.toISOString(),
        $lt: endOfDay.toISOString(),
      };
    }
    if (status) {
      query.status = status;
    }
    if (orderType) {
      query.orderType = orderType;
    }
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }
    if (sellerId) {
      query.sellerId = sellerId;
    }

    const orders = await Order.paginate(query, options);
    if (!orders) {
      return res.status(400).json({
        message: `Không có dữ liệu Đơn hàng!`,
      });
    }
    return res.status(200).json({
      message: "Lấy danh sách Đơn hàng thành công!",
      orders,
    });
  } catch (error) {
    return res.status(500).json({
      message: `Đã xảy ra lỗi: ${error.message}`,
    });
  }
};

export const getOne = async (req, res) => {
  const { id } = req.params;
  try {
    const order = await Order.findById(id)
      .populate("sellerId")
      .populate("prescriptionId")
      .populate({ path: "customerId", select: "_id name phone" })
      .populate({ path: "medicines.medicineId", select: "_id name price" });

    if (!order) {
      return res.status(400).json({
        message: `Không tìm thấy dữ liệu Đơn hàng!`,
      });
    }
    return res.status(200).json({
      message: "Lấy dữ liệu Đơn hàng thành công!",
      order,
    });
  } catch (error) {
    return res.status(500).json({
      message: `Đã xảy ra lỗi: ${error.message}`,
    });
  }
};

export const createOrder = async (req, res) => {
  const { medicines } = req.body;
  try {
    const { error } = OrderValidate.validate(req.body, {
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

    // custom id order
    const lastOrder = await Order.findOne({}, {}, { sort: { _id: -1 } });
    const orderId = generateNextId(lastOrder ? lastOrder._id : null, "DH");

    // create customer
    let customerData = "";
    const customer = await Customer.findById(req.body.customerId);
    if (customer) {
      customerData = {
        _id: customer._id,
        name: customer.name,
        email: customer.email,
      };
    }

    const order = await Order.create({
      ...req.body,
      _id: orderId,
      prescriptionId: null,
      customer: customerData,
    });
    if (!order) {
      return res.status(400).json({
        message: "Không có dữ liệu Đơn hàng để thêm!",
      });
    }

    // Cập nhật lại thuốc tương ứng
    if (order && order.medicines && order.medicines.length) {
      const medicinesUpdated = order.medicines.map((med) => ({
        updateOne: {
          filter: { _id: med.medicineId },
          update: { $inc: { quantity: -med.quantity } },
        },
      }));

      if (medicinesUpdated.length > 0) {
        await Medicine.bulkWrite(medicinesUpdated);
      }
    }

    order.customer = undefined;
    return res.status(200).json({
      message: "Tạo Đơn hàng thành công!",
      order,
    });
  } catch (error) {
    return res.status(500).json({
      message: `Đã xảy ra lỗi: ${error.message}`,
    });
  }
};

export const updateOrder = async (req, res) => {
  const { status, paymentStatus, medicines } = req.body;
  const { id } = req.params;
  try {
    const order = await Order.findById(id);
    if (!order) {
      return res.status(400).json({
        message: "Không tìm thấy dữ liệu Đơn hàng cần cập nhật!",
      });
    } else if ((order && order.status === 1) || (order && order.status === 2)) {
      return res.status(400).json({
        message: "Đơn hàng này đã Hoàn thành hoặc Đã hủy, không thể chỉnh sửa!",
      });
    }

    const { error } = OrderValidate.validate(req.body, {
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
      const medicineId = med.medicineId;
      const quantity = med.quantity;

      const medicine = await Medicine.findById(medicineId);

      // Lưu trữ giá trị cũ của số lượng thuốc
      const oldQuantity = order.medicines.find(
        (m) => m.medicineId === medicineId
      ).quantity;

      if (
        !medicine ||
        medicine.quantity <= 0 ||
        medicine.quantity + oldQuantity < med.quantity
      ) {
        return res.status(400).json({
          message: `Thuốc ${medicine.name} đã hết hoặc số lượng không đủ!`,
        });
      }

      // Cập nhật số lượng thuốc
      const newQuantity = oldQuantity + medicine.quantity - quantity;
      medicine.quantity = newQuantity;

      // Lưu lại Medicine đã cập nhật
      await medicine.save();
    }

    let paymentStatusChange = paymentStatus;
    let statusChange = status;
    if (status === 1) {
      paymentStatusChange = 1;
    }

    if (paymentStatus === 1) {
      statusChange = 1;
    }

    if (status !== 1) {
      paymentStatusChange = 0;
    }

    const orderUpdated = await Order.findByIdAndUpdate(
      id,
      {
        ...req.body,
        status: statusChange,
        paymentStatus: paymentStatusChange,
      },
      { new: true }
    );

    return res.status(200).json({
      message: "Cập nhật Đơn hàng thành công!",
      order: orderUpdated,
    });
  } catch (error) {
    return res.status(500).json({
      message: `Đã xảy ra lỗi: ${error.message}`,
    });
  }
};

export const deleteOrder = async (req, res) => {
  const { id } = req.params;
  try {
    const order = await Order.findById(id);
    if (!order) {
      return res.status(400).json({
        message: "Không tìm thấy dữ liệu Đơn hàng cần xóa!",
      });
    } else if ((order && order.status === 1) || (order && order.status === 2)) {
      return res.status(400).json({
        message: "Đơn hàng này đã Hoàn thành hoặc Đã hủy, không thể xóa!",
      });
    }

    // Cập nhật lại thuốc tương ứng
    if (order && order.medicines && order.medicines.length) {
      const medicinesUpdated = order.medicines.map((med) => ({
        updateOne: {
          filter: { _id: med.medicineId },
          update: { $inc: { quantity: +med.quantity } },
        },
      }));

      if (medicinesUpdated.length > 0) {
        await Medicine.bulkWrite(medicinesUpdated);
      }
    }

    await Order.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Xóa Đơn hàng thành công!",
    });
  } catch (error) {
    return res.status(500).json({
      message: `Đã xảy ra lỗi: ${error.message}`,
    });
  }
};
