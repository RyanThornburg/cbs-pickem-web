import { initializeApp} from "firebase/app"
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  databaseURL: "https://morlockedpickem-default-rtdb.firebaseio.com/",
  projectId: "morlockedpickem",
  appId: ""
}

const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);