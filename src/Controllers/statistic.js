import ServiceByExamination from '../Models/ServiceByExamination.js';
import MedicalExaminationSlip from '../Models/MedicalExaminationSlip.js';
import Customer from '../Models/Customer.js';
import User from '../Models/User.js';
import Order from '../Models/Order.js';
import Prescription from '../Models/Prescription.js';
import moment from 'moment';
import Service from '../Models/Service.js';

// Tổng doanh thu
export const statisticTotalRevenue = async (req, res) => {
  const { from, to } = req.query;
  try {
    // query all order
    const getAllService = await ServiceByExamination.find({
      createdAt: {
        $gte: moment(from).toDate(),
        $lt: moment(to).toDate(),
      },
    }).populate([{ path: 'service_examination', select: 'price' }]);

    let totalAmount = 0;
    let actualAmount = 0;
    getAllService.forEach((i) =>
      i?.paymentStatus === 'paid'
        ? (actualAmount += Number(i?.service_examination?.price ?? 0))
        : (totalAmount += Number(i?.service_examination?.price ?? 0)),
    );
    return res.status(200).json({
      value: {
        totalAmount,
        actualAmount,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: `Đã xảy ra lỗi: ${error.message}`,
    });
  }
};

// export const totalUsingService = async (req, res) => {
//   try {
//     const services = await Service.find();
//     const serviceByExamination = await ServiceByExamination.find();
//   } catch (error) {
//     return res.status(500).json({
//       message: `Đã xảy ra lỗi: ${error.message}`,
//     });
//   }
// };

// Tỉ lệ hủy lịch
export const statisticCancellationRate = async (req, res) => {
  const { from, to } = req.query;
  try {
    const dataAll = await MedicalExaminationSlip.find({
      day_booking: {
        $gte: moment(from).toDate().toISOString(),
        $lt: moment(to).toDate().toISOString(),
      },
    });

    const dataCancel = dataAll?.filter(
      (i) => i.status === 'cancel_schedule' || i.status === 'cancel',
    );
    return res.status(200).json({
      value: [
        {
          name: 'Tổng số lượng đặt',
          value: dataAll.length,
        },
        {
          name: 'Đã hủy',
          value: dataCancel.length,
        },
      ],
    });
  } catch (error) {
    return res.status(500).json({
      message: `Đã xảy ra lỗi: ${error.message}`,
    });
  }
};

// Số lượng khách hàng
export const statisticTotalCustomer = async (_, res) => {
  try {
    const totalCustomer = await Customer.count();
    return res.status(200).json({ value: totalCustomer });
  } catch (error) {
    return res.status(500).json({
      message: `Đã xảy ra lỗi: ${error.message}`,
    });
  }
};

// Số lượng nhân viên
export const statisticTotalUser = async (req, res) => {
  const { from, to } = req.query;
  try {
    const data = await User.find({
      createdAt: {
        $gte: moment(from).toDate(),
        $lt: moment(to).toDate(),
      },
    }).populate([{ path: 'role', select: 'roleNumber' }]);

    let doctor = 0;
    let reception_staff = 0;
    let medicine_staff = 0;
    for (let i = 0; i < data.length; i++) {
      switch (data[i]?.role?.roleNumber) {
        case 1:
          doctor++;
          break;
        case 2:
          reception_staff++;
          break;
        case 3:
          medicine_staff++;
          break;
        default:
          break;
      }
    }
    return res.status(200).json({
      value: [
        {
          name: 'Bác sĩ',
          value: doctor,
        },
        {
          name: 'Nhân viên tiếp đón',
          value: reception_staff,
        },
        {
          name: 'Nhân viên bán thuốc',
          value: medicine_staff,
        },
      ],
    });
  } catch (error) {
    return res.status(500).json({
      message: `Đã xảy ra lỗi: ${error.message}`,
    });
  }
};

// Tổng số phiếu khám
export const statisticTotalExaminationSlip = async (req, res) => {
  const { from, to } = req.query;
  try {
    const totalExamination = await MedicalExaminationSlip.count({
      createdAt: {
        $gte: moment(from).toDate(),
        $lt: moment(to).toDate(),
      },
      status: {
        $in: ['recetion', 'waiting', 'running', 'done'],
      },
    });
    return res.status(200).json({ value: totalExamination });
  } catch (error) {
    return res.status(500).json({
      message: `Đã xảy ra lỗi: ${error.message}`,
    });
  }
};

// Số lượng khách hàng mới
export const statisticTotalNewCustomer = async (req, res) => {
  const { from, to } = req.query;
  try {
    const totalNewCustomer = await Customer.count({
      createdAt: {
        $gte: moment(from).toDate(),
        $lt: moment(to).toDate(),
      },
    });
    return res.status(200).json({ value: totalNewCustomer });
  } catch (error) {
    return res.status(500).json({
      message: `Đã xảy ra lỗi: ${error.message}`,
    });
  }
};

// Doanh thu bán hàng

export const statisticTotalRevenueOrder = async (req, res) => {
  const { from, to } = req.query;
  try {
    const getOrderData = await Order.find(
      {
        createdAt: {
          $gte: moment(from).toDate(),
          $lt: moment(to).toDate(),
        },
      },
      'createdAt totalAmount',
    );

    const allDates = generateDateRange(moment(from), moment(to));

    const groupedData = getOrderData.reduce((result, order) => {
      const dateKey = moment(order.createdAt).format('YYYY-MM-DD');
      result[dateKey] = (result[dateKey] || 0) + order.totalAmount;
      return result;
    }, {});

    allDates.forEach((date) => {
      const dateKey = moment(date).format('YYYY-MM-DD');
      if (!groupedData[dateKey]) {
        groupedData[dateKey] = 0;
      }
    });

    const responseData = Object.entries(groupedData).map(([date, value]) => ({
      name: date,
      value,
    }));

    return res.status(200).json(responseData);
  } catch (error) {
    return res.status(500).json({
      message: `Đã xảy ra lỗi: ${error.message}`,
    });
  }
};
// Doang thu ke don
export const statisticTotalPrescription = async (req, res) => {
  const { from, to } = req.query;
  try {
    const getOrderData = await Prescription.find(
      {
        createdAt: {
          $gte: moment(from).toDate(),
          $lt: moment(to).toDate(),
        },
        status: 2,
      },
      'createdAt totalAmount',
    );

    const allDates = generateDateRange(moment(from), moment(to));

    const groupedData = getOrderData.reduce((result, order) => {
      const dateKey = moment(order.createdAt).format('YYYY-MM-DD');
      result[dateKey] = (result[dateKey] || 0) + order.totalAmount;
      return result;
    }, {});

    allDates.forEach((date) => {
      const dateKey = moment(date).format('YYYY-MM-DD');
      if (!groupedData[dateKey]) {
        groupedData[dateKey] = 0;
      }
    });

    const responseData = Object.entries(groupedData).map(([date, value]) => ({
      name: date,
      value,
    }));

    return res.status(200).json(responseData);
  } catch (error) {
    return res.status(500).json({
      message: `Đã xảy ra lỗi: ${error.message}`,
    });
  }
};

function generateDateRange(startDate, endDate) {
  const dates = [];
  let currentDate = moment(startDate);
  while (currentDate.isSameOrBefore(endDate)) {
    dates.push(currentDate.toDate());
    currentDate.add(1, 'day');
  }
  return dates;
}

// dịch vụ sử dụng
export const statisticServiceUsage = async (req, res) => {
  const { from, to } = req.query;
  try {
    const allServices = await Service.find({}, 'id name');

    const getServiceUsageData = await ServiceByExamination.find(
      {
        createdAt: {
          $gte: moment(from).toDate(),
          $lt: moment(to).toDate(),
        },
        status: 'done',
      },
      'createdAt service_examination',
    );

    const allDates = generateDateRange(moment(from), moment(to));

    const groupedData = getServiceUsageData.reduce((result, service) => {
      const dateKey = moment(service.createdAt).format('YYYY-MM-DD');
      const serviceId = service.service_examination;

      result[dateKey] = result[dateKey] || {};
      result[dateKey][serviceId] = (result[dateKey][serviceId] || 0) + 1;

      return result;
    }, {});

    const responseData = await Promise.all(
      allDates.map(async (date) => {
        const dateKey = moment(date).format('YYYY-MM-DD');
        const servicesData = groupedData[dateKey] || {};

        const data = allServices.map((service) => {
          const serviceId = service.id;
          const count = servicesData[serviceId] ?? 0;

          return {
            label: service.name,
            value: count,
          };
        });

        return {
          date: dateKey,
          data,
        };
      }),
    );

    return res.status(200).json(responseData);
  } catch (error) {
    return res.status(500).json({
      message: `Đã xảy ra lỗi: ${error.message}`,
    });
  }
};
