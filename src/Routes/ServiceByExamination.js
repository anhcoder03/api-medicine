import express from "express";
import {
  createServiceByExamination,
  deleteServiceByExam,
  getAllByIdExamination,
  getAllServiceByExamination,
  getOne,
  updateServiceByExam,
  updateServiceByIdExamination,
} from "../Controllers/ServiceByExamination.js";
import authenticate from "../Middlewares/authenticate.js";
import { doctorAuth, generalAuth } from "../Middlewares/authorization.js";

const router = express.Router();
router.get(
  "/serviceByExamination",
  authenticate,
  generalAuth,
  getAllServiceByExamination
);
router.get(
  "/serviceByExamination/:id",
  getAllByIdExamination
);
router.get("/serviceExaminationById/:id", authenticate, generalAuth, getOne);
router.put(
  "/serviceExaminationById/:id",
  authenticate,
  doctorAuth,
  updateServiceByExam
);

router.put(
  "/updatePaymentService/:id",
  authenticate,
  doctorAuth,
  updateServiceByIdExamination
);
router.post("/serviceByExamination", authenticate, createServiceByExamination);
router.delete(
  "/serviceByExamination/:id",
  authenticate,
  doctorAuth,
  deleteServiceByExam
);
export default router;
