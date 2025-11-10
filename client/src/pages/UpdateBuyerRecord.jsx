import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSingleBuyerProductQuery, useUpdateAllBuyerProductMutation } from '../redux/features/BuyerProductApi/buyerProductApi';
import Swal from 'sweetalert2';

const UpdateBuyerRecord = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    // Fetch single product data
    const { data: product, isLoading: isLoadingProduct, isError } = useSingleBuyerProductQuery(id);
    
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
                expire_date: product.expire_date ? product.expire_date.split('T')[0] : '',
                date: product.date ? product.date.split('T')[0] : ''
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
        
        try {
            await updateAllBuyerProduct({ 
                id, 
                userData: formData 
            }).unwrap();

            Swal.fire({
                title: 'Success!',
                text: 'Product updated successfully!',
                icon: 'success',
                confirmButtonText: 'OK'
            });

            navigate('/buyer-record');
        } catch (error) {
            console.error('Update error:', error);
            Swal.fire({
                title: 'Error!',
                text: 'Failed to update product. Please try again.',
                icon: 'error',
                confirmButtonText: 'OK'
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
        <div>
            <form className="product_form form_div mb-4" onSubmit={handleSubmit}>
                <h2 className="mt-5 mb-5 card-title gradient_text">Update Buyer Product</h2>

                <div className="input_div d-flex flex-column input_width">
                    <label>Product Name</label>
                    <input 
                        type="text" 
                        name="product_name" 
                        value={formData.product_name} 
                        onChange={handleInputs} 
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
                    />
                </div>

                <div className="input_div d-flex flex-column input_width">
                    <label>Product Saling Price</label>
                    <input 
                        type="number" 
                        name="saling_price" 
                        value={formData.saling_price} 
                        onChange={handleInputs} 
                    />
                </div>

                <div className="input_div d-flex flex-column input_width">
                    <label>Remaining Stock</label>
                    <input 
                        type="number" 
                        name="stock" 
                        value={formData.stock} 
                        onChange={handleInputs} 
                    />
                </div>

                <div className='d-flex justify-content-between input_width'>
                    <div className="input_div d-flex flex-column input_width">
                        <label>Expire Date</label>
                        <input 
                            type="date" 
                            name="expire_date" 
                            value={formData.expire_date} 
                            onChange={handleInputs} 
                            style={{ width: '157px' }} 
                        />
                    </div>

                    <div className="input_div d-flex flex-column input_width">
                        <label>Product Date</label>
                        <input 
                            type="date" 
                            name="date" 
                            value={formData.date} 
                            onChange={handleInputs} 
                            style={{ width: '157px' }} 
                        />
                    </div>
                </div>

                <div className="btn_wrapper mt-2 mb-5">
                    <button 
                        type="submit" 
                        className="btn btn-danger input_width" 
                        disabled={isUpdating}
                    >
                        {isUpdating ? 'Updating...' : 'Update Product'}
                    </button>
                </div>
            </form>
        </div>
    )
}

export default UpdateBuyerRecord;