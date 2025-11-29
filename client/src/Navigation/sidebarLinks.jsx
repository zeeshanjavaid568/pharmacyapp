import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

export const sidebarLinks = [
    {
        id: 1,
        link: '/',
        text: 'Dashboard',
        icon: <FontAwesomeIcon icon="fa-solid fa-house" />
    },
    {
        id: 2,
        link: '#',
        text: 'Records',
        icon: <FontAwesomeIcon icon="fa-solid fa-address-card" />,
        children: [
            {
                icon: <FontAwesomeIcon icon="fa-solid fa-address-card" />,
                selectedIcon: "/assets/images/dashboard/camera.png",
                link: '/buyer-record',
                text: 'Purchase Products',
            },
            {
                icon: <FontAwesomeIcon icon="fa-solid fa-address-card" />,
                selectedIcon: "/assets/images/dashboard/camera.png",
                link: '/buyer-daily-total-price-record',
                text: 'Purchase Daily Products Total Price',
            },
            {
                icon: <FontAwesomeIcon icon="fa-solid fa-address-card" />,
                selectedIcon: "/assets/images/dashboard/camera.png",
                link: '/saler-record',
                text: 'Saler Products',
            },
            {
                icon: <FontAwesomeIcon icon="fa-solid fa-address-card" />,
                selectedIcon: "/assets/images/dashboard/camera.png",
                link: '/saler-daily-total-price-record',
                text: 'Saler Daily Products Total Price',
            },
            // {
            //     icon: <FontAwesomeIcon icon="fa-solid fa-address-card" />,
            //     selectedIcon: "/assets/images/dashboard/camera.png",
            //     link: '/daily-profit',
            //     text: 'Daily Profit',
            // },
            // {
            //     icon: <FontAwesomeIcon icon="fa-solid fa-address-card" />,
            //     selectedIcon: "/assets/images/dashboard/camera.png",
            //     link: '/monthly-profit',
            //     text: 'Monthly Profit',
            // },
        ],
    },
    {
        id: 3,
        link: '/duesrecord',
        text: 'Dues',
        icon: <FontAwesomeIcon icon="fa-solid fa-address-card" />,

    }

]