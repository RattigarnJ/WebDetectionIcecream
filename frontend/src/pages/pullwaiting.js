import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../App.css';

const PullWait = () => {
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const pollStatus = async () => {
      try {
        const response = await axios.get('http://localhost:5000/rpa_status');
        const { running} = response.data;
        if (!running) {
          navigate('/pullsuccess');
        }
      } catch (err) {
        setError(err.response?.data?.error || 'เกิดข้อผิดพลาดในการตรวจสอบสถานะ');
      }
    };
    const intervalId = setInterval(pollStatus, 2000);
    return () => clearInterval(intervalId);
  }, [navigate]);

  return (
    <div className="waiting-container">
      <h2 className="waiting-title">RPA RUNNING</h2>
      {error && <p className="error">{error}</p>}
      <div className="loader" style={{marginTop: '20px'}}></div>
    </div>
  );
};

export default PullWait;