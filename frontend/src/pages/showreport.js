import '../App.css';
import React from "react";
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import logosearch from "C:\\Users\\Ratti\\myicecreamapp\\frontend\\src\\components\\search.png"

import { Pie } from 'react-chartjs-2'; // Import Pie component
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const ShowReport = () => {

    const [images, setImages] = useState([]);
    const [modalOpen, setModalOpen] = useState(false); // สถานะสำหรับเปิด/ปิด Modal
    const [selectedImage, setSelectedImage] = useState(null); // ข้อมูลของการ์ดที่เลือก
    const [data, setData] = useState([]);
    // eslint-disable-next-line no-unused-vars
    const [pie, setPie] = useState([]);
    const [modalOpenChart, setModalOpenChart] = useState(false); // สถานะสำหรับเปิด/ปิด Modal

    const [dateStart, setDateStart] = useState('');
    const [dateStop, setDateStop] = useState('');
    const [mode, setMode] = useState('');
    // eslint-disable-next-line no-unused-vars
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [predictionResult, setPredictionResult] = useState('All');
    const [branch, setBranch] = useState("");

    useEffect(() => {
        fetchPredictions();
        fetchCsvData();
        fetchReportInfo();
    }, []);

    const fetchPredictions = async () => {
        try {
            const response = await axios.get("http://127.0.0.1:5000/predict_all");
            setImages(response.data);
        } catch (error) {
            console.error("Error fetching predictions:", error);
        }
    };

    const openModal = (img) => {
        setSelectedImage(img); // เก็บข้อมูลของการ์ดที่เลือก
        setModalOpen(true); // เปิด Modal
    };

    const closeModal = () => {
        setModalOpen(false); // ปิด Modal
        setSelectedImage(null); // ล้างข้อมูล
    };

    const openModalChart = (pie) => {
        setPie(pie); // เก็บข้อมูลของการ์ดที่เลือก
        setModalOpenChart(true); // เปิด Modal
    };

    const closeModalChart = () => {
        setModalOpenChart(false); // ปิด Modal
        setPie(null); // ล้างข้อมูล
    };

    // Prepare Pie Chart Data for Predictions
    const getPredictionPieChartData = () => {
        // Count occurrences of each prediction result
        const predictionCounts = images.reduce((acc, item) => {
            const prediction = item.prediction === 1
                ? "Etc."
                : item.prediction === 2
                    ? "Vertical Freezer"
                    : "Horizontal Freezer"; // Adjust based on your prediction values
            acc[prediction] = (acc[prediction] || 0) + 1;
            return acc;
        }, {});

        // Define chart data
        const chartData = {
            labels: Object.keys(predictionCounts), // e.g., ["Not Cabinet", "Standing Cabinet", "Lying down Cabinet"]
            datasets: [
                {
                    label: 'Prediction Results',
                    data: Object.values(predictionCounts), // e.g., [3, 2, 1]
                    backgroundColor: [
                        '#252525', // Not Cabinet
                        '#0c67aa', // Standing Cabinet
                        '#ffbe00', // Lying down Cabinet
                    ],
                    borderWidth: 0,
                },
            ],
        };

        return chartData;
    };

    // Pie Chart Options
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            tooltip: {
                callbacks: {
                    label: (context) => `${context.label}: ${context.raw} รายการ`,
                },
            },
        },
    };

    const fetchCsvData = async () => {
        try {
            const response = await axios.get("http://127.0.0.1:5000/get_csv_data");
            console.log("CSV Data:", response.data); // Debug the response
            setData(response.data);
        } catch (error) {
            console.error("Error fetching CSV data:", error);
        }
    };

    const fetchReportInfo = async () => {
        setLoading(true);
        try {
            const response = await axios.get('http://127.0.0.1:5000/get_report_info');
            setDateStart(response.data.datestart);
            setDateStop(response.data.datestop);
            setMode(response.data.modetext);
        } catch (err) {
            setError('ไม่สามารถดึงข้อมูลจากเซิร์ฟเวอร์ได้');
            console.error('Error fetching report info:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredImages = useMemo(() => {
        // กรองตาม predictionResult
        let result = images.filter(img => {
            if (predictionResult === 'All') return true;
            if (predictionResult === 'st') return img.prediction === 2;
            if (predictionResult === 'ld') return img.prediction === 0;
            if (predictionResult === 'nc') return img.prediction === 1;
            return false;
        });

        // กรองตาม branch
        if (branch.trim() !== '') {
            result = result.filter(img => {
                const branchCode = img.filename?.split('_')[0];
                return branchCode?.toLowerCase().includes(branch.toLowerCase());
            });
        }

        return result;
    }, [images, predictionResult, branch]);

    const downloadCSV = () => {
        // สร้างหัวข้อของไฟล์ CSV
        const header = [
            'จองโดย',
            'หมายเลขงาน',
            'รหัสร้าน',
            'ชื่อร้าน',
            'โซน',
            'ทีม',
            'สัญญา',
            'ผู้รับผิดชอบงาน',
            'แผนเข้างาน',
            'เวลาเริ่มงาน',
            'เวลาปิดงาน',
            'ข้อเสนอแนะ',
            'ข้อเสนอแนะเพิ่มเติม',
            'ความถูกต้องของสาขา',
        ];

        // ฟังก์ชัน escape เพื่อหลีกเลี่ยงปัญหาการใช้เครื่องหมายอัญประกาศในข้อมูล
        const escape = (str) => {
            if (typeof str !== 'string') return '""'; // จัดการกรณีข้อมูลไม่ใช่ string
            if (str.indexOf('"') !== -1 || str.indexOf(',') !== -1 || str.indexOf('\n') !== -1) {
                str = `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        // แปลงข้อมูลจาก data เป็นบรรทัด CSV
        const rows = data.map(item => {
            const branchCode = item["รหัสร้าน"] || '-';
            // ตรวจสอบความถูกต้องจาก filteredImages
            const branchImages = filteredImages.filter(
                (img) => img.filename?.startsWith(branchCode + '_')
            );

            // ตรวจสอบความถูกต้องตามโหมด
            let hasCorrectPrediction = false;
            if (mode === 'HORIZONTAL FREEZER ') {
                const countPredictionOne = branchImages.filter(
                    (img) => img.prediction === 1
                ).length;
                hasCorrectPrediction = countPredictionOne >= 1;
            } else if (mode === 'VERTICAL FREEZER ') {
                const countPredictionTwo = branchImages.filter(
                    (img) => img.prediction === 2
                ).length;
                hasCorrectPrediction = countPredictionTwo >= 1;
            }

            return [
                escape(item["จองโดย"] || '-'),
                escape(item["หมายเลขงาน"] || '-'),
                escape(branchCode),
                escape(item["ชื่อร้าน"] || '-'),
                escape(item["โซน"] || '-'),
                escape(item["ทีม"] || '-'),
                escape(item["สัญญา"] || '-'),
                escape(item["ผู้รับผิดชอบงาน"] || '-'),
                escape(item["แผนเข้างาน"] || '-'),
                escape(item["เวลาเริ่มงาน"] || '-'),
                escape(item["เวลาปิดงาน"] || '-'),
                escape(item["ข้อเสนอแนะ"] || '-'),
                escape(item["ข้อเสนอแนะเพิ่มเติม"] || '-'),
                escape(hasCorrectPrediction ? 'ถูกต้อง' : 'ไม่ถูกต้อง'),
            ];
        });

        // สร้างเนื้อหา CSV
        const csvContent = [
            header.join(','), // บรรทัดหัว
            ...rows.map(row => row.join(',')) // ข้อมูลแต่ละบรรทัด
        ].join('\n'); // ใช้ '\n' เพื่อแยกแต่ละบรรทัด

        // เพิ่ม BOM เพื่อให้รองรับ UTF-8 ใน Excel
        const BOM = '\uFEFF'; // Byte Order Mark สำหรับ UTF-8
        const csvWithBOM = BOM + csvContent;

        // สร้าง Blob สำหรับไฟล์ CSV และตั้งค่าการเข้ารหัสเป็น UTF-8
        const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });

        // สร้างลิงก์ดาวน์โหลด
        const link = document.createElement('a');
        if (link.download !== undefined) { // ตรวจสอบว่า browser รองรับการดาวน์โหลดไฟล์
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'show_report.csv'); // ชื่อไฟล์ที่ดาวน์โหลด
            document.body.appendChild(link); // เพิ่ม link ลงใน DOM
            link.click(); // คลิกเพื่อดาวน์โหลด
            document.body.removeChild(link); // ลบ link ออกจาก DOM
        }
    };

    const getPredictionCounts = () => {
        const counts = filteredImages.reduce((acc, img) => {
            const prediction = img.prediction === 1
                ? "Etc."
                : img.prediction === 2
                    ? "Vertical Freezer"
                    : "Horizontal Freezer";
            acc[prediction] = (acc[prediction] || 0) + 1;
            return acc;
        }, { "Etc.": 0, "Vertical Freezer": 0, "Horizontal Freezer": 0 }); // กำหนดค่าเริ่มต้นให้ครบทุกหมวด

        return counts;
    };

    // ใน return ของ component เพิ่มส่วนแสดงผล (เช่น ใต้ Pie Chart)
    const predictionCounts = getPredictionCounts();

    const getBranchCorrectnessPieChartData = () => {
        const branchCorrectnessCounts = data.reduce(
            (acc, item) => {
                const branchCode = item["รหัสร้าน"] || '-';
                const branchImages = filteredImages.filter(
                    (img) => img.filename?.startsWith(branchCode + '_')
                );

                // ตรวจสอบความถูกต้องตามโหมด
                let hasCorrectPrediction = false;
                if (mode === 'HORIZONTAL FREEZER ') { // สมมติว่า mode เป็น "Mode 1" หรือ "Mode 2"
                    const countPredictionOne = branchImages.filter(
                        (img) => img.prediction === 1
                    ).length;
                    hasCorrectPrediction = countPredictionOne >= 1;
                } else if (mode === 'VERTICAL FREEZER ') {
                    const countPredictionTwo = branchImages.filter(
                        (img) => img.prediction === 2
                    ).length;
                    hasCorrectPrediction = countPredictionTwo >= 1;
                }

                if (hasCorrectPrediction) {
                    acc.correct += 1;
                } else {
                    acc.incorrect += 1;
                }
                return acc;
            },
            { correct: 0, incorrect: 0 }
        );

        // Define chart data
        const chartData = {
            labels: ['Correct', 'Incorrect'],
            datasets: [
                {
                    label: 'Branch Correctness',
                    data: [branchCorrectnessCounts.correct, branchCorrectnessCounts.incorrect],
                    backgroundColor: [
                        '#4CAF50', // Green for Correct
                        '#F44336', // Red for Incorrect
                    ],
                    borderWidth: 0,
                },
            ],
        };

        return chartData;
    };

    return (
        <div style={{ flex: 1, justifyContent: 'center' }}>
            {error && (
                <p style={{ color: 'red', fontSize: '16px', marginLeft: '250px', marginTop: '130px' }}>
                    {error}
                </p>
            )}
            {/* แสดงข้อมูล report */}
            <p style={{ marginTop: error ? '20px' : '130px', fontSize: '16px', marginLeft: '250px', fontWeight: 'bold' }}>
                {dateStart || 'N/A'} - {dateStop || 'N/A'}
            </p>
            <p style={{ fontSize: '50px', fontWeight: 'bold', marginLeft: '250px', marginTop: '-20px' }}>
                {mode || 'ยังไม่มีโหมด'} REPORT
            </p>
            <button
                onClick={downloadCSV}
                style={{ height: '40px', width: '100px', fontSize: '16px', cursor: 'pointer', marginLeft: '1000px', marginBottom: '20px', borderRadius: '15px', borderWidth: '0px', marginTop: '-100px', backgroundColor: '#eaf6ff' }}
            >
                Export CSV
            </button>
            <div style={{ width: '870px', height: '300px', backgroundColor: '#d9d9d9', marginLeft: '240px', borderRadius: '30px' }}>
                <div style={{
                    maxHeight: '300px', // Matches container height
                    overflowX: 'auto', // Horizontal scroll for wide content
                    overflowY: 'auto', // Vertical scroll for more rows
                    borderRadius: '20px'
                }}>
                    <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        backgroundColor: '#fff',
                        tableLayout: 'fixed',
                    }}>
                        <thead>
                            <tr style={{ backgroundColor: '#eaf6ff' }}>
                                <th style={{ padding: '10px', fontSize: '14px', width: '150px' }}>สถานะการเข้างาน</th>
                                <th style={{ padding: '10px', fontSize: '14px', width: '200px' }}>จองโดย</th>
                                <th style={{ padding: '10px', fontSize: '14px', width: '100px' }}>หมายเลขงาน</th>
                                <th style={{ padding: '10px', fontSize: '14px', width: '80px' }}>รหัสร้าน</th>
                                <th style={{ padding: '10px', fontSize: '14px', width: '150px' }}>ชื่อร้าน</th>
                                <th style={{ padding: '10px', fontSize: '14px', width: '50px' }}>โซน</th>
                                <th style={{ padding: '10px', fontSize: '14px', width: '50px' }}>ทีม</th>
                                <th style={{ padding: '10px', fontSize: '14px', width: '100px' }}>สัญญา</th>
                                <th style={{ padding: '10px', fontSize: '14px', width: '120px' }}>ผู้รับผิดชอบงาน</th>
                                <th style={{ padding: '10px', fontSize: '14px', width: '100px' }}>แผนเข้างาน</th>
                                <th style={{ padding: '10px', fontSize: '14px', width: '100px' }}>เวลาเริ่มงาน</th>
                                <th style={{ padding: '10px', fontSize: '14px', width: '100px' }}>เวลาปิดงาน</th>
                                <th style={{ padding: '10px', fontSize: '14px', width: '150px' }}>ข้อเสนอแนะ</th>
                                <th style={{ padding: '10px', fontSize: '14px', width: '100px' }}>ข้อเสนอแนะเพิ่มเติม</th>
                                <th style={{ padding: '10px', fontSize: '14px', width: '100px' }}>ความถูกต้องของสาขา</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.length > 0 ? (
                                data.map((item, index) => {
                                    const branchCode = item["รหัสร้าน"] || '-';
                                    const branchImages = filteredImages.filter(
                                        (img) => img.filename?.startsWith(branchCode + '_')
                                    );

                                    // ตรวจสอบความถูกต้องตามโหมด
                                    let hasCorrectPrediction = false;
                                    if (mode === 'HORIZONTAL FREEZER ') {
                                        const countPredictionOne = branchImages.filter(
                                            (img) => img.prediction === 1
                                        ).length;
                                        hasCorrectPrediction = countPredictionOne >= 1;
                                    } else if (mode === 'VERTICAL FREEZER ') {
                                        const countPredictionTwo = branchImages.filter(
                                            (img) => img.prediction === 2
                                        ).length;
                                        hasCorrectPrediction = countPredictionTwo >= 1;
                                    }

                                    return (
                                        <tr key={index} style={{ borderBottom: '1px solid #ddd' }}>
                                            <td style={{ padding: '10px', fontSize: '14px', textAlign: 'center' }}>{item["สถานะการเข้างาน"] || '-'}</td>
                                            <td style={{ padding: '10px', fontSize: '14px', textAlign: 'left' }}>{item["จองโดย"] || '-'}</td>
                                            <td style={{ padding: '10px', fontSize: '14px', textAlign: 'center' }}>{item["หมายเลขงาน"] || '-'}</td>
                                            <td style={{ padding: '10px', fontSize: '14px', textAlign: 'center' }}>{branchCode}</td>
                                            <td style={{ padding: '10px', fontSize: '14px', textAlign: 'center' }}>{item["ชื่อร้าน"] || '-'}</td>
                                            <td style={{ padding: '10px', fontSize: '14px', textAlign: 'center' }}>{item["โซน"] || '-'}</td>
                                            <td style={{ padding: '10px', fontSize: '14px', textAlign: 'center' }}>{item["ทีม"] || '-'}</td>
                                            <td style={{ padding: '10px', fontSize: '14px', textAlign: 'center' }}>{item["สัญญา"] || '-'}</td>
                                            <td style={{ padding: '10px', fontSize: '14px', textAlign: 'center' }}>{item["ผู้รับผิดชอบงาน"] || '-'}</td>
                                            <td style={{ padding: '10px', fontSize: '14px', textAlign: 'center' }}>{item["แผนเข้างาน"] || '-'}</td>
                                            <td style={{ padding: '10px', fontSize: '14px', textAlign: 'center' }}>{item["เวลาเริ่มงาน"] || '-'}</td>
                                            <td style={{ padding: '10px', fontSize: '14px', textAlign: 'center' }}>{item["เวลาปิดงาน"] || '-'}</td>
                                            <td style={{ padding: '10px', fontSize: '14px', textAlign: 'center' }}>{item["ข้อเสนอแนะ"] || '-'}</td>
                                            <td style={{ padding: '10px', fontSize: '14px', textAlign: 'left' }}>{item["ข้อเสนอแนะเพิ่มเติม"] || '-'}</td>
                                            <td style={{ padding: '10px', fontSize: '14px', textAlign: 'center', color: hasCorrectPrediction ? 'green' : 'red' }}>
                                                {hasCorrectPrediction ? 'ถูกต้อง' : 'ไม่ถูกต้อง'}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="14" style={{ textAlign: 'center', padding: '10px' }}>No data available</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <p style={{ fontSize: '20px', marginLeft: '250px', marginTop: '50px', fontWeight: 'bold' }}>Branch Correctness Pie Chart</p>
            <div style={{
                width: '870px',
                height: '480px',
                backgroundColor: '#eaf6ff',
                marginLeft: '240px',
                borderRadius: '30px',
                marginTop: '30px',
                position: 'relative',
                padding: '20px',
            }}>
                <div style={{
                    width: '400px',
                    height: '400px',
                    marginLeft: '27%',
                    marginTop: '30px'
                }}>
                    {data.length > 0 ? (
                        <Pie data={getBranchCorrectnessPieChartData()} options={chartOptions} />
                    ) : (
                        <p style={{ fontSize: '16px', color: '#666', textAlign: 'center', marginTop: '180px' }}>
                            No branch data available
                        </p>
                    )}
                </div>
                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                    <p style={{ fontSize: '16px' }}>
                        <strong>Correct :</strong> {data.filter(item => {
                            const branchCode = item["รหัสร้าน"] || '-';
                            const branchImages = filteredImages.filter(
                                (img) => img.filename?.startsWith(branchCode + '_')
                            );
                            if (mode === 'HORIZONTAL FREEZER ') {
                                return branchImages.filter(img => img.prediction === 1).length > 1;
                            } else if (mode === 'VERTICAL FREEZER ') {
                                return branchImages.filter(img => img.prediction === 2).length > 1;
                            }
                            return false;
                        }).length} |
                        <strong> Incorrect :</strong> {data.filter(item => {
                            const branchCode = item["รหัสร้าน"] || '-';
                            const branchImages = filteredImages.filter(
                                (img) => img.filename?.startsWith(branchCode + '_')
                            );
                            if (mode === 'HORIZONTAL FREEZER ') {
                                return branchImages.filter(img => img.prediction === 1).length <= 1;
                            } else if (mode === 'VERTICAL FREEZER ') {
                                return branchImages.filter(img => img.prediction === 2).length <= 1;
                            }
                            return true; // ถ้า mode ไม่ใช่ 1 หรือ 2 นับเป็น incorrect
                        }).length}
                    </p>
                </div>
            </div>
            <p style={{ fontSize: '20px', marginLeft: '250px', marginTop: '50px', fontWeight: 'bold' }}>Pie Chart of the Proportion of Predicted Images</p>
            <div style={{
                width: '870px',
                height: '480px', // Your specified height
                backgroundColor: '#eaf6ff',
                marginLeft: '240px',
                borderRadius: '30px',
                marginTop: '30px',
                position: 'relative', // For positioning the button
                padding: '20px', // Space around the chart
            }}>
                <div
                    className="circle-button"
                    onClick={() => openModalChart()}
                    style={{
                        backgroundColor: 'white',
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        position: 'absolute',
                        top: '10px',
                        right: '10px', // Adjusted from marginLeft: '95%'
                        cursor: 'pointer',
                    }}
                >
                    <img src={logosearch} alt="logo" style={{ width: '15px' }} />
                </div>
                <div style={{
                    width: '400px', // Custom width for the Pie Chart
                    height: '400px', // Custom height for the Pie Chart
                    marginLeft: '27%', // Center the chart
                    marginTop: '30px'
                }}>
                    {images.length > 0 ? (
                        <Pie data={getPredictionPieChartData()} options={chartOptions} />
                    ) : (
                        <p style={{ fontSize: '16px', color: '#666', textAlign: 'center', marginTop: '180px' }}>No prediction data available</p>
                    )}
                </div>
                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                    <p style={{ fontSize: '16px' }}>
                        <strong>Etc.:</strong> {predictionCounts["Etc."]}  |
                        <strong> Vertical Freezer:</strong> {predictionCounts["Vertical Freezer"]}  |
                        <strong> Horizontal Freezer:</strong> {predictionCounts["Horizontal Freezer"]}
                    </p>
                </div>
            </div>
            <div style={{ marginTop: '50px' }}>
                <label htmlFor="predictionResult" style={{ marginLeft: '250px', fontSize: '20px', fontWeight: 'bold' }}>Select Prediction Result : </label>
                <select
                    id="predictionResult"
                    value={predictionResult}
                    onChange={(e) => setPredictionResult(e.target.value)}
                    style={{ padding: '5px', fontSize: '20px', height: '50px', width: '660px', textAlign: 'center', borderRadius: '15px', marginLeft: '15px' }}
                >
                    <option value="All">ALL</option>
                    <option value="st">Vertical Freezer</option>
                    <option value="ld">Horizontal Freezer</option>
                    <option value="nc">Etc.</option>
                </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: '30px' }}>
                <p style={{ marginLeft: '250px', fontSize: '20px', fontWeight: 'bold' }}>Branch Search : </p>
                <input
                    id="branchSearch"
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    required
                    placeholder=" Enter branch"
                    style={{ width: '745px', height: '45px', borderRadius: '15px', borderWidth: '1px', marginLeft: '15px', fontSize: '20px' }}
                />
            </div>
            <p style={{ fontSize: '20px', marginLeft: '250px', marginTop: '50px', fontWeight: 'bold' }}>Prediction Report</p>
            <div className="prediction-report">
                <div className="prediction-grid">
                    {filteredImages.length > 0 ? (
                        filteredImages.map((img, index) => {
                            const filename = img.filename?.replace(/\.[^/.]+$/, ''); // remove extension
                            const [code, ...rest] = filename ? filename.split('_') : ['-', '-'];
                            const name = rest.length > 0 ? rest.join('_') : '-';

                            return (
                                <div key={index} className="prediction-card">
                                    <img src={img.path} alt={img.filename} className="image-placeholder" />

                                    <div className="button-container">
                                        <div className="circle-button" onClick={() => openModal(img)}>
                                            <img src={logosearch} alt="logo" style={{ width: '15px', cursor: 'pointer' }} />
                                        </div>
                                    </div>

                                    <div className="prediction-info">
                                        <p><strong>Branch:</strong> {code}</p>
                                        <p><strong>Name:</strong> {name}</p>
                                        <p>
                                            <strong>Prediction Result:</strong>{' '}
                                            {img.prediction === 1
                                                ? 'Etc.'
                                                : img.prediction === 2
                                                    ? 'Vertical Freezer'
                                                    : img.prediction === 0
                                                        ? 'Horizontal Freezer'
                                                        : `Unknown (${img.prediction})` || '-'}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p style={{
                            fontSize: '16px',
                            width: '500px',
                            marginLeft: '10px',
                            color: 'red'
                        }}>
                            No images match the selected prediction
                        </p>
                    )}
                </div>
            </div>
            {modalOpen && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content">
                        <p style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '30px' }}>IMAGES DETAILS</p>
                        {selectedImage && (
                            <>
                                <img src={selectedImage.path} alt={selectedImage.filename} className="modal-image" />
                            </>
                        )}
                    </div>
                </div>
            )}
            {modalOpenChart && (
                <div className="modal-overlay" onClick={closeModalChart}>
                    <div className="modal-content" style={{
                        width: '900px',
                        height: '550px',
                        padding: '20px',
                        backgroundColor: '#fff',
                        borderRadius: '10px'
                    }}>
                        <p style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', marginTop: '5px' }}>Prediction Details : {dateStart} - {dateStop}</p>
                        <div style={{ width: '450px', height: '450px', margin: '0 auto' }}>
                            <Pie data={getPredictionPieChartData()} options={chartOptions} />
                        </div>
                        <div style={{ marginTop: '20px', textAlign: 'center' }}>
                            <p style={{ fontSize: '16px' }}>
                                <strong>Etc.:</strong> {predictionCounts["Etc."]}  |
                                <strong> Vertical Freezer:</strong> {predictionCounts["Vertical Freezer"]}  |
                                <strong> Horizontal Freezer:</strong> {predictionCounts["Horizontal Freezer"]}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShowReport;