import '../App.css';
import React from "react";
import { useState, useEffect} from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import logo from "../components/back.png";

const ShowST = () => {

    const navigate = useNavigate();

    const [selectedDateStart, setSelectedDateStart] = useState("");
    const [selectedDateStop, setSelectedDateStop] = useState("");
    const [period, setPeriodday] = useState("");
    const [mode, setMode] = useState("");

    const splitDate = (dateString1, dateString2) => {
        const [year1, month1, day1] = dateString1.split("-");
        const [year2, month2, day2] = dateString2.split("-")
        return { day1, day2, year1, year2, month1, month2 };
    };

    useEffect(() => {
        if (selectedDateStart && selectedDateStop) {
            const { day1, day2 } = splitDate(selectedDateStart, selectedDateStop);
            setPeriodday(day2 - day1);
            setMode("st");
        }
    }, [selectedDateStart, selectedDateStop]);

    const getShow = async () => {
        try {
            // eslint-disable-next-line no-unused-vars
            const response = await axios.post("http://localhost:5000/getinfoshow", {
                datestart: selectedDateStart,
                datestop: selectedDateStop,
                period: period,
                mode: mode,
            });

            navigate("/showreport");

        } catch (error) {
            console.error("Error:", error);
        }
    };

    return (
        <div className="Containner-show">
            <p className='Text-PS-H-ST' style={{ alignSelf: 'center' }}>VERTICAL FREEZER CONTRACT</p>
            <p className='Text-PS-H-ST' style={{ marginTop: '-35px', alignSelf: 'center' }}>SHOW REPORT</p>
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
                onClick={getShow}
            >
                SHOW
            </button>
            <div className='Div-back' style={{ position: 'fixed' }}>
                <Link to="/show" className="logo">
                    <img src={logo} alt="" className="Back-ele" style={{}} />
                    <p className='Back-text' style={{ position: 'fixed' }}>BACK</p>
                </Link>
            </div>
        </div>
    );
};

export default ShowST;