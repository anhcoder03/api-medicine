import Joi from "joi";
export const userValidate = Joi.object({
  _id: Joi.string(),
  name: Joi.string().required().trim().messages({
    "string.empty": "Tên người dùng không được để trống",
    "any.required": "Trường Tên người dùng là bắt buộc!",
  }),
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      "string.empty": "Email không được để trống",
      "string.email": "Email không đúng định dạng",
    }),
  password: Joi.any(),
  phone: Joi.string()
    .trim()
    .required()
    .pattern(/^[0-9]{10}$|^[0-9]{11}$/)
    .message("Số điện thoại phải là 10 hoặc 11 số"),
  role: Joi.string().required().messages({
    "string.empty": "Vai trò không được để trống",
    "any.required": "Trường Vai trò là bắt buộc!",
  }),
  avatar: Joi.string().empty(Joi.allow()),
  verifyToken: Joi.any(),
  otpCode: Joi.any(),
});

export const signInValidate = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      "string.empty": "Email không được để trống",
      "string.email": "Email không đúng định dạng",
    }),
  password: Joi.string().required().trim().min(6).max(15).messages({
    "string.empty": "Mật khẩu không được để trống",
    "any.required": "Trường Mật khẩu là bắt buộc!",
    "string.min": "Mật khẩu phải có ít nhất 6 ký tự",
    "string.max": "Mật khẩu không được vượt quá 15 ký tự",
  }),
});

export const changePasswordValidate = Joi.object({
  _id: Joi.string().required().messages({
    "string.empty": "ID Người dùng không được để trống",
    "any.required": "Trường ID Người dùng là bắt buộc!",
  }),
  password: Joi.string().required().trim().messages({
    "string.empty": "Mật khẩu cũ không được để trống",
    "any.required": "Trường  Mật khẩu cũ là bắt buộc!",
  }),
  newPassword: Joi.string().required().trim().min(6).max(15).messages({
    "string.empty": "Mật khẩu mới không được để trống",
    "any.required": "Trường Mật khẩu mới là bắt buộc!",
    "string.min": "Mật khẩu mới phải có ít nhất 6 ký tự",
    "string.max": "Mật khẩu mới không được vượt quá 15 ký tự",
  }),
});

export const resetPasswordValidate = Joi.object({
  newPassword: Joi.string().required().trim().min(6).max(15).messages({
    "string.empty": "Mật khẩu mới không được để trống",
    "any.required": "Trường Mật khẩu mới là bắt buộc!",
    "string.min": "Mật khẩu mới phải có ít nhất 6 ký tự",
    "string.max": "Mật khẩu mới không được vượt quá 15 ký tự",
  }),
});
