import '../App.css';
import React from "react";
import { useNavigate, Link} from "react-router-dom";
import logo from "../components/back.png";

const PullSuccess = () => {

    const navigate = useNavigate();

    const handleShow = () => {
        navigate("/show");
    };

    return (
        <div className='Containner-pullsuccess'>
            <p style={{ fontSize: '40px', fontWeight: 'bold' }}>IMPORT IMAGES SUCCESS</p>
            <p style={{ marginTop: '-30px', cursor: 'pointer' }} onClick={handleShow}>Let's show report</p>
            <div className='Div-back' style={{ position: 'fixed' }}>
                <Link to="/pull" className="logo">
                    <img src={logo} alt="" className="Back-ele" style={{}} />
                    <p className='Back-text' style={{ position: 'fixed' }}>BACK</p>
                </Link>
            </div>
        </div>
    );
};

export default PullSuccess;