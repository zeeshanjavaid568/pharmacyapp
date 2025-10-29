import React, { useState } from 'react';
import { useAuth } from '../redux/features/ProtectRoutes/AuthProvider';
import { useDispatch } from 'react-redux';
import { useUserLoginMutation } from '../redux/features/auth/authApi';
import { Link, useNavigate } from 'react-router-dom';
import { setToken } from '../redux/features/auth/authSlice';
import Swal from 'sweetalert2/dist/sweetalert2.js'

const Login = () => {
  const loginFormData = {
    email: '',
    password: ''
  };

  const [formData, setFormData] = useState(loginFormData);
  const [errors, setErrors] = useState({});
  const { login } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [userLogin, { isLoading, isError }] = useUserLoginMutation();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (isLoading) {
    return <div>isLoading...</div>
  }

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!/^[\w.%+-]+@[\w.-]+\.[a-zA-Z]{2,}$/.test(formData.email)) {
      newErrors.email = 'Enter a valid email.';
    }

    // Password validation
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required.';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateForm()) {
      try {
        const response = await userLogin({ email: formData.email, password: formData.password }).unwrap();
        console.log("Login successful:", response);
        dispatch(setToken(response.token));
        login();
        Swal.fire({
          title: 'Success',
          text: 'User registered successfully.',
          icon: 'success',
          confirmButtonText: 'Ok',
          buttonsStyling: false, // Disable default SweetAlert2 button styles
          customClass: {
              confirmButton: 'sweetalert_btn_success', // Custom CSS class for the confirm button
          },
      });
      
        navigate('/');
      } catch (error) {
        console.error("Login failed:", error);
        Swal.fire({
          title: 'Error!',
          text: 'User registration failed.',
          icon: 'error',
          confirmButtonText: 'Ok',
          buttonsStyling: false,
          customClass: {
              confirmButton: 'sweetalert_btn_error', // Custom CSS class for the error button
          },
      });
      
      }
    }
  };


  return (
    <>
      <div
        className='main_wrapper d-flex justify-content-center align-items-center'
        style={{ height: '100vh' }}
      >
        <div
          className='form_div d-flex flex-column justify-content-center align-items-center rounded-3'
          style={{ width: '50vh' }}
        >
          <form
            onSubmit={handleSubmit}
            className='d-flex flex-column justify-content-center align-items-center'
            style={{ height: '50vh' }}
          >
            <h1 className='heading mb-5 gradient_text'> Login </h1>
            <div
              className='input_div d-flex flex-column'
              style={{ width: '30vh' }}
            >
              <label>Email</label>
              <input
                type="email"
                onChange={handleChange}
                value={formData.email}
                name="email"
              />
              {errors.email && (
                <small style={{ color: 'red' }}>{errors.email}</small>
              )}
            </div>
            <div
              className='input_div d-flex flex-column'
              style={{ width: '30vh' }}
            >
              <label>Password</label>
              <input
                type="password"
                onChange={handleChange}
                value={formData.password}
                name="password"
              />
              {errors.password && (
                <small style={{ color: 'red' }}>{errors.password}</small>
              )}
            </div>
            <button type="submit" className='btn btn-danger my-3'>
              Submit
            </button>
            <div>
              <span>Before login go to </span>
              <Link to={'/register'} className='text-decoration-none gradient_text'> Sign up </Link>
              <span>page</span>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default Login;

