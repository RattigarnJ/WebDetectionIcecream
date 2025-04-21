import '../App.css';
import React from "react";
import { useNavigate } from "react-router-dom";
import logoup from "C:\\Users\\Ratti\\WebDetectionIcecream\\frontend\\src\\components\\up.png"
import logodown from "C:\\Users\\Ratti\\WebDetectionIcecream\\frontend\\src\\components\\down.png"

const Pull = () => {

    const navigate = useNavigate();

    const handlePullST = () => {
        navigate("/pullst");
    };

    const handlePullLD = () => {
        navigate("/pullld");
    };

    return (
        <div className="Containner-pull">
            <p className='Text-PS-H'>IMPORT IMAGES</p>
            <p className='Text-PS-S'>choose the contract you want to import</p>
            <div style={{display: 'flex', flexDirection: 'row', marginTop: '10px'}}>
            <div className='Box-PS' style={{ marginRight: '50px' }} onClick={handlePullST}>
                <div className='Circle' onClick={handlePullST} style={{marginTop: '25px'}}>
                    <img src={logoup} alt="logo" style={{ width: '120px', marginTop: '-8px', marginLeft: '-9px', cursor: 'pointer' }} onClick={handlePullST} />
                </div>
                <p className='Text-PS-C'>VERTICAL FREEZER</p>
                <p className='Text-PS-C' style={{marginTop: '-15px'}}>CONTRACT</p>
            </div>
            <div className='Box-PS'onClick={handlePullLD}>
                <div className='Circle' onClick={handlePullLD} style={{marginTop: '25px'}}>
                    <img src={logodown} alt="logo" style={{ width: '120px', marginTop: '-9px', marginLeft: '-10px', cursor: 'pointer' }} onClick={handlePullLD} />
                </div>
                <p className='Text-PS-C'>HORIZONTAL FREEZER</p>
                <p className='Text-PS-C' style={{marginTop: '-15px'}}>CONTRACT</p>
            </div>
            </div>
        </div>
    );
};

export default Pull;
