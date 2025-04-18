import '../App.css';
import React from "react";
import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import logo from "../components/back.png";

const PullST = () => {

    const navigate = useNavigate();

    const [selectedDateStart, setSelectedDateStart] = useState("");
    const [selectedDateStop, setSelectedDateStop] = useState("");
    const [periodday, setPeriodday] = useState(0);
    const [mode, setMode] = useState("");

    const splitDate = (dateString1, dateString2) => {
        const [year1, month1, day1] = dateString1.split("-");
        const [year2, month2, day2] = dateString2.split("-")
        return { year1, month1, day1, day2, year2, month2 };
    };

    function getColumnAndRow(selectedDate) {
        if (!selectedDate) {
            console.error("Error: selectedDate is undefined or null");
            return { day: null, column: null, row: null };
        }

        const dateObj = new Date(selectedDate);
        if (isNaN(dateObj.getTime())) {
            console.error(`Error: Invalid Date format - selectedDate: ${selectedDate}`);
            return { day: null, column: null, row: null };
        }

        let weekday = (dateObj.getDay()) % 7 + 1;
        let column = weekday;
        let day = dateObj.getDate();

        const firstDayOfMonth = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1);
        let firstDayColumn = ((firstDayOfMonth.getDay() + 6) % 7) + 1;
        let dayPosition = day + (firstDayColumn - 1);
        let row = (Math.ceil(dayPosition / 7)) - 1;

        return { day, column, row };
    }

    const { year1, month1 } = splitDate(selectedDateStart, selectedDateStop);

    useEffect(() => {
        if (selectedDateStart && selectedDateStop) {
            const { day1, day2 } = splitDate(selectedDateStart, selectedDateStop);
            setPeriodday(day2 - day1);
            setMode("st");
        }
    }, [selectedDateStart, selectedDateStop]);

    // eslint-disable-next-line no-unused-vars
    const { day, column, row } = useMemo(() => getColumnAndRow(selectedDateStart), [selectedDateStart]);

    const runRPA = async () => {
        try {
            console.log("Calling /run_rpa with data:", { row, column, month1, year1, periodday, mode });
            const runResponse = await axios.post(
                "http://localhost:5000/run_rpa",
                {
                    row: row,
                    column: column,
                    month1: month1,
                    year1: year1,
                    periodday: periodday,
                    moderun: mode,
                }
            );

            console.log("Run RPA response:", runResponse.data);

            // ตรวจสอบ response จาก /run_rpa
            if (runResponse.data.message === "✅ RPA started successfully") {
                // หน่วงเวลาเล็กน้อยเพื่อให้ rpa_running อัปเดต
                await new Promise(resolve => setTimeout(resolve, 1000));

                console.log("Calling /rpa_status");
                const statusResponse = await axios.get("http://localhost:5000/rpa_status");
                console.log("RPA Status response:", statusResponse.data);

                const { running } = statusResponse.data;
                console.log("Navigating to:", running ? "/pullwaiting" : "/pullsuccess");
                navigate(running ? "/pullwaiting" : "/pullsuccess");
            } else {
                // setMessage(runResponse.data.error || "RPA ไม่สามารถเริ่มได้ รอการดำเนินการ");
                console.log("Navigating to /pullwaiting");
                navigate("/pullwaiting");
            }
        } catch (error) {
            console.error("Error:", error.response?.data, error.response?.status);
            // setMessage(error.response?.data?.error || "RPA ไม่สามารถเริ่มได้ รอการดำเนินการ");
            console.log("Navigating to /pullwaiting");
            navigate("/pullwaiting");
        }
    };

    return (
        <div className="Containner-pull">
            <p className='Text-PS-H-ST' style={{ alignSelf: 'center' }}>VERTICAL FREEZER CONTRACT</p>
            <p className='Text-PS-H-ST' style={{ marginTop: '-35px', alignSelf: 'center' }}>IMPORT IMAGES</p>
            <p style={{ marginLeft: '-480px' }}>Day - Start</p>
            <input
                type="date"
                value={selectedDateStart}
                onChange={(e) => setSelectedDateStart(e.target.value)}
                min="2024-01-01"
                max="2025-12-31"
                className='Date-picker'
                required
            />
            <p style={{ marginLeft: '-480px' }}>Day - Stop</p>
            <input
                type="date"
                value={selectedDateStop}
                onChange={(e) => setSelectedDateStop(e.target.value)}
                min="2024-01-01"
                max="2025-12-31"
                className='Date-picker'
                required
            />
            <button
                className='Button-Pull'
                onClick={runRPA}
            >
                IMPORT
            </button>
            <div className='Div-back' style={{ position: 'fixed' }}>
                <Link to="/pull" className="logo">
                    <img src={logo} alt="" className="Back-ele" style={{}} />
                    <p className='Back-text' style={{ position: 'fixed' }}>BACK</p>
                </Link>
            </div>
        </div>
    );
};

export default PullST;