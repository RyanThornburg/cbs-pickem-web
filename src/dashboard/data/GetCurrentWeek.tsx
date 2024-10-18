import { onValue, ref } from "firebase/database";
import { useEffect, useState } from 'react';
import { db } from "../../components/firebase";

export default function GetCurrentWeek() {
    const [week, setWeek] = useState(1);

    useEffect(()=>{
        const userRef = ref(db, 'currentWeek/')
        return onValue(userRef, (snapshot) => {
            if (snapshot.exists()) {
                setWeek((snapshot.val()))
            }
        })
    }, [])
    return week
}