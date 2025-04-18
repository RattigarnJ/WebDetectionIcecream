import '../App.css';
import React from "react";
import { useNavigate } from "react-router-dom";
import logoup from "C:\\Users\\Ratti\\myicecreamapp\\frontend\\src\\components\\up.png"
import logodown from "C:\\Users\\Ratti\\myicecreamapp\\frontend\\src\\components\\down.png"

const Show = () => {

    const navigate = useNavigate();

    const handleShowST = () => {
        navigate("/showst");
    };

    const handleShowLD = () => {
        navigate("/showld");
    };

    return (
        <div className="Containner-show">
            <p className='Text-PS-H'>SHOW REPORT</p>
            <p className='Text-PS-S'>choose the contract you want to show</p>
            <div style={{ display: 'flex', flexDirection: 'row', marginTop: '10px' }}>
                <div className='Box-PS' style={{ marginRight: '50px' }} onClick={handleShowST}>
                    <div className='Circle' onClick={handleShowST} style={{ marginTop: '25px' }}>
                        <img src={logoup} alt="logo" style={{ width: '65px', marginTop: '8px', marginLeft: '18px', cursor: 'pointer' }} onClick={handleShowST} />
                    </div>
                    <p className='Text-PS-C'>VERTICAL FREEZER</p>
                    <p className='Text-PS-C' style={{ marginTop: '-15px' }}>CONTRACT</p>
                </div>
                <div className='Box-PS' onClick={handleShowLD}>
                    <div className='Circle' onClick={handleShowLD} style={{ marginTop: '25px' }}>
                        <img src={logodown} alt="logo" style={{ width: '70px', marginTop: '5px', marginLeft: '15px', cursor: 'pointer' }} onClick={handleShowLD} />
                    </div>
                    <p className='Text-PS-C'>HORIZONTAL FREEZER</p>
                    <p className='Text-PS-C' style={{ marginTop: '-15px' }}>CONTRACT</p>
                </div>
            </div>
        </div>
    );
};

export default Show;