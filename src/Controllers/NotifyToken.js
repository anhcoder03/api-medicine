import NotifyToken from "../Models/NotifyToken.js";

export const createNotifyToken = async (req, res) => {
  try {
    const notifyToken = await NotifyToken.create(req.body);
    return res.status(200).json({
      message: "Tạo token thành công!",
      notifyToken,
    });
  } catch (error) {
    return res.status(500).json({
      message: error,
    });
  }
};

export const getAllToken = async (req, res) => {
  try {
    const notifyTokens = await NotifyToken.find({});

    if (!notifyTokens.length) {
      return res.status(400).json({
        message: "Danh sách token trống!",
      });
    }
    const registrationTokens = notifyTokens.map(
      (tokenObj) => tokenObj.notifyToken
    );
    return res.status(200).json({
      message: "Lấy danh sách token thành công!",
      registrationTokens,
    });
  } catch (error) {
    return res.status(500).json({
      message: error,
    });
  }
};

export const getOneToken = async (req, res) => {
  const { token } = req.params;
  try {
    const notifyToken = await NotifyToken.findOne({ notifyToken: token });

    if (!notifyToken) {
      return res.status(404).json({
        message: "Token không tồn tại!",
      });
    }

    return res.status(200).json({
      message: "Lấy token thành công!",
      notifyToken,
    });
  } catch (error) {
    return res.status(500).json({
      message: error,
    });
  }
};

export const getNotifyTokens = async (req, res) => {
  try {
    const notifyTokens = await NotifyToken.find({});

    if (!notifyTokens.length) {
      return [];
    }

    const registrationTokens = [];
    const uniqueTokensSet = new Set(); // Sử dụng Set để lưu trữ các giá trị duy nhất

    notifyTokens.forEach((tokenObj) => {
      const notifyToken = tokenObj.notifyToken;

      // Kiểm tra xem notifyToken đã có hay chưa
      if (!uniqueTokensSet.has(notifyToken)) {
        uniqueTokensSet.add(notifyToken);
        registrationTokens.push(notifyToken);
      }
    });

    return registrationTokens;
  } catch (error) {
    return res.status(500).json({
      message: error,
    });
  }
};
