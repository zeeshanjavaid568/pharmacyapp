import React from 'react'
import Searchbar from '../components/common/Searchbar'
import Sidebar from '../Navigation/Sidebar'
import ResponsiveSidebar from '../Navigation/ResponsiveSidebar'
import { Outlet } from 'react-router-dom';

const Layout = () => {

  return (
    <>
      <div className='layout_wrapper d-flex'>
        <div className='sidebar_wrapper pt-4 d-none d-xxl-block d-xl-block d-lg-none'>
          <Sidebar />
        </div>
        <div className='main_content_wrapper w-100'>
          <div className='layout_border_bottom d-flex justify-content-between d-xxl-block d-xl-block p-0'>
            <div className='responsive_sidebar_wrapper d-xxl-none d-xl-none '>
              <ResponsiveSidebar />
            </div>
            <div className='searchbar_wrapper w-100'>
              <Searchbar />
            </div>
          </div>
          <div className='m-4'>
            <Outlet />
          </div>
        </div>
      </div>
    </>
  )
}

export default Layout;
