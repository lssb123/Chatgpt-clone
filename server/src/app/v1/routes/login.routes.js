import express from 'express';
const router = express.Router();

router.route("/").post(LoginProcess);

export default router;