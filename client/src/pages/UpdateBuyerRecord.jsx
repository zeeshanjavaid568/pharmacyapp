import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSingleBuyerProductQuery, useUpdateAllBuyerProductMutation } from '../redux/features/BuyerProductApi/buyerProductApi';
import Swal from 'sweetalert2';

const UpdateBuyerRecord = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // Fetch single product data
    const { data: product, refetch, isLoading: isLoadingProduct, isError } = useSingleBuyerProductQuery(id);

    // Update mutation
    const [updateAllBuyerProduct, { isLoading: isUpdating }] = useUpdateAllBuyerProductMutation();

    // Form state
    const [formData, setFormData] = useState({
        product_name: '',
        saling_price: '',
        product_price: '',
        pieces_price: '',
        pieces: '',
        stock: '',
        expire_date: '',
        date: ''
    });

    // Auto-calculate pieces_price when product_price or pieces changes
    useEffect(() => {
        if (formData.product_price && formData.pieces) {
            const calculatedPiecesPrice = parseFloat(formData.product_price) * parseInt(formData.pieces);
            setFormData(prev => ({
                ...prev,
                pieces_price: calculatedPiecesPrice.toString()
            }));
        }
    }, [formData.product_price, formData.pieces]);

    // Format date for input field (YYYY-MM-DD)
    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '';
            // Adjust for timezone offset to ensure correct date display
            const offset = date.getTimezoneOffset() * 60000;
            const localDate = new Date(date.getTime() - offset);
            return localDate.toISOString().split('T')[0];
        } catch (error) {
            console.error('Date formatting error:', error);
            return '';
        }
    };

    // Populate form when product data is fetched
    useEffect(() => {
        if (product) {
            setFormData({
                product_name: product.product_name || '',
                saling_price: product.saling_price || '',
                product_price: product.product_price || '',
                pieces_price: product.pieces_price || '',
                pieces: product.pieces || '',
                stock: product.stock || '',
                expire_date: product.expire_date ? formatDateForInput(product.expire_date) : '',
                date: product.date ? formatDateForInput(product.date) : ''
            });
        }
    }, [product]);

    // Handle input changes
    const handleInputs = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Format dates to ISO string for database
        const formattedData = {
            ...formData,
            // Convert date strings to ISO format
            expire_date: formData.expire_date ? new Date(formData.expire_date).toISOString() : null,
            date: formData.date ? new Date(formData.date).toISOString() : new Date().toISOString(),
            // Ensure numeric values are properly converted
            product_price: parseFloat(formData.product_price) || 0,
            saling_price: formData.saling_price || 0,
            pieces_price: parseFloat(formData.pieces_price) || 0,
            pieces: parseInt(formData.pieces) || 0,
            stock: parseInt(formData.stock) || 0
        };

        try {
            await updateAllBuyerProduct({
                id,
                userData: formattedData
            }).unwrap();

            Swal.fire({
                title: 'Success!',
                text: 'Product updated successfully!',
                icon: 'success',
                confirmButtonText: 'OK',
                customClass: { confirmButton: 'sweetalert_btn_success' },
            });
            refetch();
            navigate('/buyer-record');
        } catch (error) {
            console.error('Update error:', error);
            Swal.fire({
                title: 'Error!',
                text: error?.data?.message || 'Failed to update product. Please try again.',
                icon: 'error',
                confirmButtonText: 'OK',
                customClass: { confirmButton: 'sweetalert_btn_error' },
            });
        }
    };

    // Show loading while fetching product data
    if (isLoadingProduct) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
                <div className="spinner-border text-danger" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    // Show error if product fetch fails
    if (isError) {
        return (
            <div className="alert alert-danger text-center" role="alert">
                Failed to load product data. Please try again.
            </div>
        );
    }

    return (
        <div className='d-flex justify-content-center'>
            <form className="product_form form_div mb-4" style={{ width: '500px' }} onSubmit={handleSubmit}>
                <h4 className="mt-5 mb-5 card-title gradient_text">Update Purchase Product</h4>

                <div className="input_div d-flex flex-column input_width">
                    <label>Product Name</label>
                    <input
                        type="text"
                        name="product_name"
                        value={formData.product_name}
                        onChange={handleInputs}
                        required
                    />
                </div>

                <div className='d-flex justify-content-between input_width'>
                    <div className="input_div d-flex flex-column">
                        <label>Product Price</label>
                        <input
                            type="number"
                            name="product_price"
                            value={formData.product_price}
                            onChange={handleInputs}
                            style={{ width: '157px' }}
                            step="0.01"
                            min="0"
                            required
                        />
                    </div>
                    <div className="input_div d-flex flex-column ms-2">
                        <label>Total Pieces Price</label>
                        <input
                            type="number"
                            name="pieces_price"
                            value={formData.pieces_price}
                            style={{ width: '157px' }}
                            disabled
                            step="0.01"
                        />
                    </div>
                </div>

                <div className="input_div d-flex flex-column input_width">
                    <label>Pieces</label>
                    <input
                        type="number"
                        name="pieces"
                        value={formData.pieces}
                        onChange={handleInputs}
                        min="1"
                        required
                    />
                </div>

                <div className="input_div d-flex flex-column input_width">
                    <label>Product Selling Price</label>
                    <input
                        type="text"
                        name="saling_price"
                        value={formData.saling_price}
                        onChange={handleInputs}
                        step="0.01"
                        min="0"
                        required
                    />
                </div>

                <div className="input_div d-flex flex-column input_width">
                    <label>Remaining Stock</label>
                    <input
                        type="number"
                        name="stock"
                        value={formData.stock}
                        onChange={handleInputs}
                        min="0"
                        required
                    />
                </div>

                <div className='d-flex justify-content-between input_width'>
                    <div className="input_div d-flex flex-column">
                        <label>Expire Date</label>
                        <input
                            type="date"
                            name="expire_date"
                            value={formData.expire_date}
                            onChange={handleInputs}
                            style={{ width: '157px' }}
                            required
                        />
                    </div>

                    <div className="input_div d-flex flex-column">
                        <label>Purchase Date</label>
                        <input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleInputs}
                            style={{ width: '157px' }}
                            required
                        />
                    </div>
                </div>

                <div className="btn_wrapper mt-2 mb-5 d-flex flex-column">
                    <button
                        type="submit"
                        className="btn btn-danger input_width"
                        disabled={isUpdating}
                    >
                        {isUpdating ? 'Updating...' : 'Update Product'}
                    </button>
                    <button
                        type="button"
                        className="btn btn-success px-4 mt-2"
                        onClick={() => navigate('/buyer-record')}
                        disabled={isUpdating}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    )
}

export default UpdateBuyerRecord;