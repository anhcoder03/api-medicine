import mongoose, { Schema } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
const PrescriptionSchema = new Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    doctorId: {
      type: String,
      ref: "User",
    },
    medicalExaminationSlipId: {
      type: String,
      ref: "MedicalExaminationSlip",
    },
    customerId: {
      type: String,
      ref: "Customer",
    },
    customer: {
      _id: String,
      name: String,
      phone: String,
    },
    doctor: {
      _id: String,
      name: String,
      phone: String,
    },
    diagnostic: String,
    advice: String,
    medicines: [
      {
        medicineId: {
          type: String,
          ref: "Medicine",
        },
        quantity: Number,
        unit_selling: String, // đơn vị xuất kho
        unit_using: String, // đơn vị sử dụng
        dosage: String, // liều dùng
        timesUsePerDay: Number, // số lần sử dụng/ngày
        how_using: String, // cách dùng
      },
    ],
    totalAmount: Number,
    status: {
      type: Number,
      enum: [1, 2, 3], // enum: [1: "Chờ thực hiện", 2: "Hoàn thành", 3: "Hủy"],
      default: 1,
    },
    paymentStatus: {
      type: Number,
      enum: [0, 1], // enum: [0: "Chờ thanh toán", 1: "Đã thanh toán"],
      default: 0,
    },
    paymentMethod: {
      type: Number,
      enum: [1, 2], // enum: [1: "Chuyển khoản", 2: "Tiền mặt"],
    },
    cancel_reason: {
      type: String,
      default: null,
    },
    note: {
      type: String,
      default: null,
    },
  },
  { versionKey: false, timestamps: true }
);

PrescriptionSchema.plugin(mongoosePaginate);
export default mongoose.model("Prescription", PrescriptionSchema);
