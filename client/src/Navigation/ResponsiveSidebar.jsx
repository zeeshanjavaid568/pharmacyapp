import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React from 'react'
import Sidebar from './Sidebar'

const ResponsiveSidebar = () => {
    return (
        <>
            <FontAwesomeIcon icon="fa-solid fa-bars"
                type="button"
                data-bs-toggle="offcanvas"
                data-bs-target="#offcanvasScrolling"
                aria-controls="offcanvasScrolling"
                className='mx-4 responsive_sidebar_btn'
            />
            <div
                className="offcanvas offcanvas-start"
                data-bs-scroll="true"
                data-bs-backdrop="false"
                tabIndex={-1}
                id="offcanvasScrolling"
                aria-labelledby="offcanvasScrollingLabel"
            >
                <div className="offcanvas-header">
                    <button
                        type="button"
                        className="btn-close text-reset"
                        data-bs-dismiss="offcanvas"
                        aria-label="Close"
                    />
                </div>
                <div className="offcanvas-body">
                    <Sidebar />
                </div>
            </div>

        </>

    )
}

export default ResponsiveSidebar
