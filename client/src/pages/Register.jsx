import React, { useState } from 'react';
import { useUserRegisterMutation } from '../redux/features/auth/authApi';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2/dist/sweetalert2.js';

const Register = () => {
    const registerFormData = {
        username: '',
        email: '',
        password: '',
        profileImage: null,
    };

    const [formData, setFormData] = useState(registerFormData);
    const [previewImage, setPreviewImage] = useState(null); // State for preview
    const [errors, setErrors] = useState({});
    const [userRegister, { isLoading }] = useUserRegisterMutation();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value, type, files } = e.target;

        if (type === 'file') {
            const file = files[0];
            if (file) {
                setFormData({ ...formData, [name]: file });
                setPreviewImage(URL.createObjectURL(file)); // Generate preview URL
            }
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.username.trim()) {
            newErrors.username = 'Username is required.';
        }
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required.';
        } else if (!/^[\w.%+-]+@[\w.-]+\.[a-zA-Z]{2,}$/.test(formData.email)) {
            newErrors.email = 'Enter a valid email.';
        }
        if (!formData.password.trim()) {
            newErrors.password = 'Password is required.';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters.';
        }
        if (!formData.profileImage) {
            newErrors.profileImage = 'Profile image is required.';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (validateForm()) {
            const formDataToSend = new FormData();
            formDataToSend.append('username', formData.username);
            formDataToSend.append('email', formData.email);
            formDataToSend.append('password', formData.password);
            formDataToSend.append('profileImage', formData.profileImage);

            try {
                const response = await userRegister(formDataToSend).unwrap();
                Swal.fire({
                    title: 'Success',
                    text: 'User registered successfully.',
                    icon: 'success',
                    confirmButtonText: 'Ok',
                    buttonsStyling: false,
                    customClass: {
                        confirmButton: 'sweetalert_btn_success',
                    },
                });
                setFormData(registerFormData); // Reset form
                setPreviewImage(null); // Reset preview
                navigate('/login');
            } catch (error) {
                console.error(error);
                Swal.fire({
                    title: 'Error!',
                    text: 'User registration failed.',
                    icon: 'error',
                    confirmButtonText: 'Ok',
                    buttonsStyling: false,
                    customClass: {
                        confirmButton: 'sweetalert_btn_error',
                    },
                });

            }
        }
    };

    return (
        <div className="main_wrapper d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
            <div className="form_div d-flex flex-column justify-content-center align-items-center rounded-3" style={{ width: '55vh' }}>
                <form onSubmit={handleSubmit} className="d-flex flex-column justify-content-center align-items-center" style={{ height: '700px' }}>
                    <h1 className="heading mb-5 gradient_text">Register</h1>
                    <div className="input_div d-flex flex-column align-items-center justify-content-center" style={{ width: '35vh' }}>
                        <div
                            className="image-circle"
                            style={{
                                width: '100px',
                                height: '100px',
                                borderRadius: '50%',
                                border: '2px dashed #ccc',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                backgroundImage: `url(${previewImage || ''})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                position: 'relative',
                            }}
                            onClick={() => document.getElementById('fileInput').click()}
                        >
                            {/* {!previewImage && <span style={{ color: '#aaa' }}>Upload Image</span>} */}
                        </div>
                        <input
                            id="fileInput"
                            type="file"
                            name="profileImage"
                            accept="image/*"
                            onChange={handleChange}
                            style={{ display: 'none' }}
                        />
                        <label className='my-2'>Upload Image</label>
                        {errors.profileImage && <small style={{ color: 'red' }}>{errors.profileImage}</small>}
                    </div>
                    <div className="input_div d-flex flex-column" style={{ width: '35vh' }}>
                        <label>User Name</label>
                        <input
                            onChange={handleChange}
                            value={formData.username}
                            name="username"
                        />
                        {errors.username && <small style={{ color: 'red' }}>{errors.username}</small>}
                    </div>
                    <div className="input_div d-flex flex-column" style={{ width: '35vh' }}>
                        <label>Email</label>
                        <input
                            onChange={handleChange}
                            value={formData.email}
                            name="email"
                            type="email"
                        />
                        {errors.email && <small style={{ color: 'red' }}>{errors.email}</small>}
                    </div>
                    <div className="input_div d-flex flex-column" style={{ width: '35vh' }}>
                        <label>Password</label>
                        <input
                            onChange={handleChange}
                            value={formData.password}
                            name="password"
                            type="password"
                        />
                        {errors.password && <small style={{ color: 'red' }}>{errors.password}</small>}
                    </div>
                    <button type="submit" className="btn btn-danger mt-4">Submit</button>
                    <div className="mt-3">
                        <span>Already signed up? Go to </span>
                        <Link to="/login" className="text-decoration-none gradient_text">Sign In </Link>
                        <span>page</span>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;
