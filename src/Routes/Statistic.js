import { Router } from "express";
import {
  statisticCancellationRate,
  statisticServiceUsage,
  statisticTotalCustomer,
  statisticTotalExaminationSlip,
  statisticTotalNewCustomer,
  statisticTotalPrescription,
  statisticTotalRevenue,
  statisticTotalRevenueOrder,
  statisticTotalUser,
} from "../Controllers/statistic.js";

const router = Router();
router.get("/statisticTotalRevenue", statisticTotalRevenue);
router.get("/statisticCancellationRate", statisticCancellationRate);
router.get("/statisticTotalCustomer", statisticTotalCustomer);
router.get("/statisticTotalUser", statisticTotalUser);
router.get("/statisticTotalExaminationSlip", statisticTotalExaminationSlip);
router.get("/statisticTotalNewCustomer", statisticTotalNewCustomer);
router.get("/statisticTotalRevenueOrder", statisticTotalRevenueOrder);
router.get("/statisticTotalPrescription", statisticTotalPrescription);
router.get("/statisticServiceUsage", statisticServiceUsage);

export default router;
