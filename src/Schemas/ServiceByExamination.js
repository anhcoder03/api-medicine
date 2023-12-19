import Joi from "joi";
const serviceByExamValidate = Joi.object({
  customerId: Joi.string().required().trim().messages({
    "string.empty": "ID khách hàng không được để trống",
    "any.required": "Trường ID khách hàng là bắt buộc!",
  }),
  doctorId: Joi.string().required().trim().messages({
    "string.empty": "ID bác sĩ không được để trống",
    "any.required": "Trường ID bác sĩ là bắt buộc!",
  }),
  staffId: Joi.string().required().trim().messages({
    "string.empty": "Nhân viên tiếp đón không được để trống",
    "any.required": "Trường Nhân viên tiếp đón là bắt buộc!",
  }),
  clinicId: Joi.string().required().trim().messages({
    "string.empty": "Phòng khám không được để trống",
    "any.required": "Trường Phòng khám là bắt buộc!",
  }),
  examinationId: Joi.string().required().trim().messages({
    "string.empty": "Mã phiếu khám không được để trống",
    "any.required": "Mã phiếu khám là bắt buộc!",
  }),
  paymentStatus: Joi.string(),
  services: Joi.any(),
});
export default serviceByExamValidate;
