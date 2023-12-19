import Joi from "joi";
const customerValidate = Joi.object({
  _id: Joi.string(),
  name: Joi.string().trim().required().messages({
    "string.empty": "Tên khách hàng không được để trống",
    "any.required": "Trường Tên khách hàng là bắt buộc!",
  }),
  province: Joi.object().required().messages({
    "string.empty": "Trường Tỉnh không được để trống",
    "any.required": "Trường Tỉnh là bắt buộc!",
  }),
  district: Joi.object().required().messages({
    "string.empty": "Trường Huyện không được để trống",
    "any.required": "Trường Huyện là bắt buộc!",
  }),
  commune: Joi.object().required().messages({
    "string.empty": "Trường Xã không được để trống",
    "any.required": "Trường Xã là bắt buộc!",
  }),
  detailedAddress: Joi.string().empty(Joi.allow()).trim(),
  phone: Joi.string()
    .trim()
    .required()
    .pattern(/^[0-9]{10}$|^[0-9]{11}$/)
    .message("Số điện thoại phải là 10 hoặc 11 số"),
  citizenId: Joi.string()
    .trim()
    .required()
    .pattern(/^[0-9]{9}$|^[0-9]{12}$/)
    .message("Căn cước công dân không hợp lệ. Phải có 9 hoặc 12 chữ số"),
  dateOfBirth: Joi.string().trim().required().messages({
    "string.empty": "Vui lòng nhập ngày sinh",
  }),
  gender: Joi.string().allow("").trim().messages({
    "string.empty": "Trường Giới tính không được để trống",
  }),
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      "string.empty": "Email không được để trống",
      "string.email": "Email không đúng định dạng",
    }),
  examination_history: Joi.any(),
  note: Joi.any(),
  creator: Joi.string().required(),
  createdAt: Joi.any(),
  updatedAt: Joi.any(),
});

export default customerValidate;
