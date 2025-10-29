import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useUserProfileQuery } from '../../redux/features/auth/authApi';

const Searchbar = () => {
    const { data, isLoading, isError } = useUserProfileQuery();
    const [currentDate, setCurrentDate] = useState('');

    // Initialize Bootstrap tooltips after rendering
    useEffect(() => {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.forEach((tooltipTriggerEl) => {
            new window.bootstrap.Tooltip(tooltipTriggerEl);
        });

        // Set the current date
        const date = new Date();
        const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
        setCurrentDate(date.toLocaleDateString('en-US', options));
    }, []);

    // Destructure data object
    const { profileImage, username, email } = data || {};

    // Tooltip content
    const tooltipContent = username && email
        ? `Name: ${username}\nEmail: ${email}`
        : 'No profile details available';

    // Profile content (conditional based on loading or error state)
    let profileContent;
    if (isLoading) {
        profileContent = (
            <div className='d-flex justify-content-center align-items-center me-5' style={{ height: '100px' }}>
                <h5>Loading...</h5>
            </div>
        );
    } else if (isError) {
        profileContent = (
            <div className='d-flex justify-content-center align-items-center me-5' style={{ height: '100px' }}>
                <h5>User Profile Data Fetching Error...</h5>
            </div>
        );
    } else {
        profileContent = (
            <>
                <img
                    className='profile_image me-3 ms-2'
                    src={profileImage}
                    alt='profile_image'
                    type="button"
                    data-bs-toggle="tooltip"
                    data-bs-placement="bottom"
                    title={tooltipContent}
                />
                <div className='Profile_details d-none d-xxl-block d-xl-block'>
                    <p><span>Name:</span> <strong>{username}</strong></p>
                    <p><span>Email:</span> <strong>{email}</strong></p>
                </div>
            </>
        );
    }

    return (
        <div className='searchbar_content mt-3 pb-4 d-flex justify-content-around align-items-center'>
            {/* Search Input */}
            <div className="search_input position-relative ms-xxl-0 ms-xl-0 ms-lg-3">
                <FontAwesomeIcon
                    icon="fa-solid fa-magnifying-glass"
                    className="position-absolute top-50 translate-middle-y ms-3 text-muted"
                />
                <input
                    type="text"
                    className="ps-5"
                    placeholder="Search..."
                    aria-label="Search"
                />
            </div>

            {/* Notifications */}
            <div className='icon_wrapper d-flex justify-content-around align-items-center'>
                <div className="position-relative mx-3">
                    <FontAwesomeIcon icon="fa-regular fa-bell" className="searchbar_icon" />
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                        9+
                        <span className="visually-hidden">unread notifications</span>
                    </span>
                </div>
            </div>

            {/* Calendar */}
            <div className="Calendar_div d-none d-xxl-block d-xl-block d-lg-block d-md-block me-xxl-5">
                <div className='d-flex justify-content-between align-items-center'>
                    <FontAwesomeIcon icon="fa-regular fa-calendar-days" style={{ fontSize: '1.5rem' }} />
                    <p className='mb-0 ms-2'>{currentDate}</p>
                </div>
            </div>

            {/* Profile*/}
            <div className='profile_wrapper d-flex justify-content-center align-items-center'>
                {profileContent}
            </div>
        </div>
    );
};

export default Searchbar;
