import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

// Define __filename and __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use path.join
const storage = multer.memoryStorage();

const uploadImage = multer({ storage: storage });

export default uploadImage;
