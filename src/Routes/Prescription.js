import { Router } from "express";
import {
  createPrescription,
  deletePrescription,
  getAllPresbyExaminationId,
  getAllPrescription,
  getOnePrescription,
  updatePrescription,
} from "../Controllers/Prescription.js";
import authenticate from "../Middlewares/authenticate.js";
import { doctorAuth, generalAuth } from "../Middlewares/authorization.js";

const router = Router();
router.get("/prescriptions", getAllPrescription);
router.post("/prescriptions", authenticate, doctorAuth, createPrescription);
router.get(
  "/prescriptions-by-examination/:medicalExaminationSlipId",
  authenticate,
  generalAuth,
  getAllPresbyExaminationId
);
router.get("/prescriptions/:id", authenticate, generalAuth, getOnePrescription);
router.put("/prescriptions/:id", authenticate, updatePrescription);
router.delete(
  "/prescriptions/:id",
  authenticate,
  generalAuth,
  deletePrescription
);

export default router;
