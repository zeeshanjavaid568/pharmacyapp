import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { sidebarLinks } from './sidebarLinks';
import Logout from '../pages/Logout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import RateList from '../components/common/RateList';

const Sidebar = () => {
    // State to track which parent is open
    const [openParent, setOpenParent] = useState(null);

    // Function to toggle open/close of child links
    const toggleParent = (id) => {
        // Check if the clicked parent is already open
        setOpenParent(openParent === id ? null : id);
    };

    return (
        <>
            <div className='sidebar_heading d-flex justify-content-center mb-4'>
                <div>
                    <h2> <span className='gradient_text'>Bani Hashim</span></h2>
                    <div className='d-flex justify-content-center'>
                        <h4 style={{ fontWeight: 'bolder' }} className='gradient_text'>Pharmacy</h4>
                    </div>
                </div>
            </div>
            <div className='sidebar_link_wrapper' data-bs-dismiss="offcanvas">
                {sidebarLinks.map((curData) => (
                    <div key={curData.id}>
                        {/* Parent link */}
                        <Link
                            className='text-decoration-none d-flex align-items-center mx-3 my-1 p-2'
                            to={curData.link}
                            onClick={() => curData.children && toggleParent(curData.id)} // Only toggle for parent with children
                        >
                            <span className='mx-2 text-danger'>{curData.icon}</span>
                            <span className='text-dark'>{curData.text}</span>
                            {curData.children && (
                                <span className='ms-auto'>
                                    <FontAwesomeIcon
                                        icon={openParent === curData.id ? 'fa-solid fa-minus' : 'fa-solid fa-plus'}
                                        className='text-danger'
                                    />
                                </span>
                            )}
                        </Link>

                        {/* Render children if parent is open */}
                        {curData.children && openParent === curData.id && (
                            <div className='ms-4'>
                                {curData.children.map((child, index) => (
                                    <Link
                                        className='text-decoration-none d-flex align-items-center mx-3 my-1 p-2'
                                        to={child.link}
                                        key={index}
                                    >
                                        <span className='mx-2 text-danger'>{child.icon}</span>
                                        <span className='text-dark'>{child.text}</span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <div className='mx-2'>
                <Logout />
            </div>
            <div className='mt-5'>
                <RateList />
            </div>
        </>
    );
};

export default Sidebar;
