import '../App.css';
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Member = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [editingUser, setEditingUser] = useState(null);
    const token = localStorage.getItem("token");  // ✅ ดึง Token จาก Local Storage

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await fetch("http://localhost:5000/users");
            const data = await response.json();
            setUsers(data);
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    const handleEdit = (user) => {
        // ใช้ plain_password จาก backend ถ้ามี
        setEditingUser({
            ...user,
            plain_password: user.plain_password || "" // แสดง plain password เดิม ถ้าไม่มีให้เป็นว่าง
        });
    };

    const handleSave = async () => {
        try {

            const userToUpdate = {
                id: editingUser.id,
                username: editingUser.username,
                password: editingUser.plain_password, // ส่ง plain password
                role: editingUser.role
            };

            await fetch(`http://localhost:5000/update-user`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`  // ✅ ส่ง Token ไปกับ Request
                },
                body: JSON.stringify(userToUpdate)
            });

            setUsers(users.map(user => user.id === editingUser.id ? editingUser : user));
            setEditingUser(null);
        } catch (error) {
            console.error("Error updating user:", error);
        }
    };

    const handleDelete = async (userId) => {
        if (!token) {
            alert("You are not authorized. Please log in.");
            navigate("/login");  // ✅ ถ้าไม่มี Token ให้ Redirect ไปหน้า Login
            return;
        }

        const confirmDelete = window.confirm("Are you sure you want to delete this user?");
        if (confirmDelete) {
            try {
                const response = await fetch(`http://localhost:5000/delete-user/${userId}`, {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`  // ✅ ส่ง Token ไปกับ Request
                    }
                });

                const result = await response.json();
                if (response.ok) {
                    setUsers(users.filter(user => user.id !== userId));  // ✅ อัปเดต UI
                } else {
                    alert(result.error || "Failed to delete user.");
                }
            } catch (error) {
                console.error("Error deleting user:", error);
            }
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw', backgroundColor: '#f4f4f4' }}>
            <div style={{ width: '90%' }}>
                <p className='Text-Welcome' style={{ textAlign: 'center', marginTop: '-40px' }}>MEMBERS</p>
                <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    backgroundColor: 'white',
                    borderRadius: '10px',
                    overflow: 'hidden'
                }}>
                    <thead>
                        <tr>
                            <th style={{ padding: '20px' }}>Username</th>
                            <th>Bcrypt Password</th>
                            <th>Password</th>
                            <th>Role</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody style={{ textAlign: 'center' }}>
                        {users.map(user => (
                            <tr key={user.id}>
                                <td>
                                    {editingUser?.id === user.id ? (
                                        <input type="text" value={editingUser.username}
                                            onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                                        />
                                    ) : user.username}
                                </td>
                                <td>{user.password}</td> {/* แสดง hashed password */}
                                <td>
                                    {editingUser?.id === user.id ? (
                                        <input
                                            type="text"
                                            value={editingUser.plain_password}
                                            onChange={(e) => setEditingUser({
                                                ...editingUser,
                                                plain_password: e.target.value
                                            })}
                                            placeholder="Enter new password"
                                        />
                                    ) : (
                                        <span>********</span> // แสดง plain password ถ้ามี
                                    )}
                                </td>
                                <td>
                                    {editingUser?.id === user.id ? (
                                        <select value={editingUser.role}
                                            onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                                        >
                                            <option value="Dev">Dev</option>
                                            <option value="Admin">Admin</option>
                                            <option value="User">User</option>
                                        </select>
                                    ) : user.role}
                                </td>
                                <td>
                                    {editingUser?.id === user.id ? (
                                        <button onClick={handleSave}>Save</button>
                                    ) : (
                                        <>
                                            <button onClick={() => handleEdit(user)}>Edit</button>
                                            <button onClick={() => handleDelete(user.id)}>Delete</button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Member;
