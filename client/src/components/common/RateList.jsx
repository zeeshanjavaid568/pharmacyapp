import React, { useMemo } from 'react'
import { useBuyerProductQuery } from '../../redux/features/BuyerProductApi/buyerProductApi';

const RateList = () => {
    const { data, isLoading, isError, error } = useBuyerProductQuery();

    const tableHeadStyling = {
        color: 'rgb(220, 14, 14)'
    }

    // Filter to get only the last entry for each product
    const lastEntries = useMemo(() => {
        if (!data || !Array.isArray(data)) return [];

        // Create a map to track the latest entry for each product
        const productMap = new Map();

        // Sort data by date/id in descending order to get latest entries first
        // Assuming your data has a date field or id that indicates recency
        const sortedData = [...data].sort((a, b) => {
            // Sort by date if available, otherwise by id
            if (a.createdAt && b.createdAt) {
                return new Date(b.createdAt) - new Date(a.createdAt);
            }
            // If no date field, sort by id assuming higher id = newer
            return (b.id || 0) - (a.id || 0);
        });

        // Iterate through sorted data and keep only the first (latest) occurrence of each product
        sortedData.forEach(item => {
            const productName = item.product_name || item.name || '';
            if (productName && !productMap.has(productName)) {
                productMap.set(productName, item);
            }
        });

        // Convert map values back to array
        return Array.from(productMap.values());
    }, [data]);

    // Handle loading state
    if (isLoading) {
        return (
            <div className='mx-2'>
                <div className='d-flex justify-content-center align-items-center mb-2'>
                    <button className="btn btn-outline-danger" type="button" data-bs-toggle="collapse" data-bs-target="#collapseExample" aria-expanded="false" aria-controls="collapseExample">
                        Rate List
                    </button>
                </div>
                <div className="collapse" id="collapseExample">
                    <div className="card card-body">
                        <div className="text-center p-3">Loading product data...</div>
                    </div>
                </div>
            </div>
        );
    }

    // Handle error state
    if (isError) {
        return (
            <div className='mx-2'>
                <div className='d-flex justify-content-center align-items-center mb-2'>
                    <button className="btn btn-outline-danger" type="button" data-bs-toggle="collapse" data-bs-target="#collapseExample" aria-expanded="false" aria-controls="collapseExample">
                        Rate List
                    </button>
                </div>
                <div className="collapse" id="collapseExample">
                    <div className="card card-body">
                        <div className="text-center p-3 text-danger">
                            Error loading data: {error?.message || 'Unknown error'}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className='mx-2'>
            <div className='d-flex justify-content-center align-items-center mb-2'>
                <button className="btn btn-outline-danger" type="button" data-bs-toggle="collapse" data-bs-target="#collapseExample" aria-expanded="false" aria-controls="collapseExample">
                    Rate List
                </button>
            </div>
            <div className="collapse" id="collapseExample">
                <div className="card card-body">
                    <div className="d-flex justify-content-center align-items-center mb-3">
                        <span className="badge bg-danger">
                            {lastEntries.length} unique products
                        </span>
                    </div>
                    <div style={{
                        maxHeight: '300px',
                        overflowY: 'auto',
                        position: 'relative'
                    }}>
                        <table className="table table-hover">
                            <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                                <tr>
                                    <th scope="col" style={tableHeadStyling}>#</th>
                                    <th scope="col" style={tableHeadStyling}>Product</th>
                                    <th scope="col" style={tableHeadStyling}>Purchase</th>
                                    <th scope="col" style={tableHeadStyling}>Sale</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lastEntries && lastEntries.length > 0 ? (
                                    lastEntries.map((product, index) => {
                                        const purchasePrice = parseFloat(product.product_price) || 0;
                                        const salePrice = product.saling_price || 0;

                                        return (
                                            <tr key={product.id || `${product.product_name || product.name}-${index}`}>
                                                <th scope="row">{index + 1}</th>
                                                <td>
                                                    <strong>{product.product_name || product.name || 'N/A'}</strong>
                                                    {product.createdAt && (
                                                        <div className="small text-muted">
                                                            Updated: {new Date(product.createdAt).toLocaleDateString()}
                                                        </div>
                                                    )}
                                                </td>
                                                <td>{purchasePrice}</td>
                                                <td>{salePrice}</td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="text-center py-4">
                                            <div className="text-muted">No products found</div>
                                            <small>Try adding some products or check your API connection</small>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default RateList