import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../redux/features/ProtectRoutes/AuthProvider';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Swal from 'sweetalert2/dist/sweetalert2';

const Logout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    try {
      logout();
      localStorage.removeItem('token');
      navigate('/login');
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
    } catch (error) {
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

  };

  return (
    <>
      <div className='logout_btn' onClick={handleLogout}>
        <Link to='#' className='mx-3 px-2  text-decoration-none text-dark'> <FontAwesomeIcon icon="fa-solid fa-arrow-right-from-bracket" className='text-danger me-2' /> Logout</Link>
      </div>
    </>
  )
};

export default Logout;
