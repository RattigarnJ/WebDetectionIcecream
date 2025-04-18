import '../App.css';
import React from "react";
import { useNavigate } from "react-router-dom";
import logoload from "../components/download.png";
import logoshow from "../components/dashboard.png";

const HomeAdmin = () => {

    const navigate = useNavigate();

    const handlePull = () => {
        navigate("/Pull");
    };

    const handleShow = () => {
        navigate("/Show");
    };

    return (
        <div className="Containner-home">
            <p className='Text-Welcome'>WELCOME</p>
            <div style={{display: 'flex', flexDirection: 'row'}}>
            <div className='Box-PS' style={{marginRight: '50px'}} onClick={handlePull}>
            <div className='Circle' onClick={handlePull}>
                <img src={logoload} alt="logo" style={{ width: '50px', marginTop: '25px', marginLeft: '25px', cursor: 'pointer'}} onClick={handlePull}/>   
            </div>
            <p className='Text-PS'>IMPORT IMAGES</p>
            </div>
            <div className='Box-PS-2' onClick={handleShow}>
            <div className='Circle2' onClick={handleShow}>
                <img src={logoshow} alt="logo" style={{ width: '50px', marginTop: '25px', marginLeft: '25px', cursor: 'pointer'}} onClick={handleShow}/>   
            </div>
            <p className='Text-PS-2'>SHOW REPORT</p>
            </div>
            </div>
        </div>
    );
};

export default HomeAdmin;