import React, { useState } from 'react';
import { useCreateBuyerProductMutation, useBuyerProductQuery } from '../../redux/features/BuyerProductApi/buyerProductApi';
import Swal from 'sweetalert2/dist/sweetalert2';

const BuyerProductCard = ({ onProductAdded }) => {
    const [formData, setFormData] = useState({
        product_name: '',
        product_price: '',
        pieces_price: '',
        pieces: '',
        stock: '',
        date: ''
    });
    const [errors, setErrors] = useState({});
    const { data: buyerProducts } = useBuyerProductQuery();  // Fetch all buyer products
    const [createBuyerProduct, { isLoading }] = useCreateBuyerProductMutation();

    const handleInputs = (e) => {
        const { name, value } = e.target;

        // Update the form data
        const updatedFormData = { ...formData, [name]: value };

        // Calculate the pieces price (product_price * stock)
        if (name === 'product_price' || name === 'stock') {
            const productPrice = Number(updatedFormData.product_price || 0);
            const stock = Number(updatedFormData.stock || 0);
            updatedFormData.pieces_price = productPrice * stock;

            // Store stock value in pieces state
            updatedFormData.pieces = stock;
        }

        setFormData(updatedFormData);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = {};

        // Validate Product Name
        if (formData.product_name.trim().length < 3) {
            validationErrors.product_name = 'Product name must be at least 3 characters long.';
        }

        // Validate Product Price
        if (!formData.product_price || Number(formData.product_price) <= 0) {
            validationErrors.product_price = 'Product price must be greater than zero.';
        }

        // Validate Pieces Price
        if (!formData.pieces_price || Number(formData.pieces_price) <= 0) {
            validationErrors.pieces_price = 'Product pieces price must be greater than zero.';
        }

        // Validate Stock
        if (!formData.stock || Number(formData.stock) <= 0) {
            validationErrors.stock = 'Stock must be greater than zero.';
        }

        // Validate Date
        if (!formData.date) {
            validationErrors.date = 'Please select a valid product date.';
        }

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setErrors({});

        try {
            // Check if product already exists
            const existingProducts = buyerProducts?.filter(
                (product) => product.product_name === formData.product_name
            );

            let newStock = Number(formData.stock);

            if (existingProducts && existingProducts.length > 0) {
                const lastProduct = existingProducts[existingProducts.length - 1];
                if (lastProduct.stock > 0) {
                    newStock += Number(lastProduct.stock);
                }
            }

            // Submit updated data with combined stock and calculated pieces price
            await createBuyerProduct({ ...formData, stock: newStock }).unwrap();
            localStorage.setItem('buyer_pieces', formData.pieces)
            Swal.fire({
                title: 'Success',
                text: 'Buyer Product Added Successfully.',
                icon: 'success',
                confirmButtonText: 'Ok',
                buttonsStyling: false,
                customClass: {
                    confirmButton: 'sweetalert_btn_success',
                },
            });

            setFormData({
                product_name: '',
                product_price: '',
                pieces_price: '',
                stock: '',
                date: ''
            });

            if (onProductAdded) {
                onProductAdded();
            }
        } catch (error) {
            console.error('Error adding product:', error);
            Swal.fire({
                title: 'Error!',
                text: 'Buyer Product Not Added',
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
        <form className="product_form form_div mb-4" onSubmit={handleSubmit}>
            <h2 className="mt-5 mb-5 card-title gradient_text">Add Buyer Product</h2>

            <div className="input_div d-flex flex-column input_width">
                <label>Product Name</label>
                <input
                    type="text"
                    value={formData.product_name}
                    onChange={handleInputs}
                    name="product_name"
                />
                {errors.product_name && <span style={{ color: 'red', fontSize: '0.8rem' }}>{errors.product_name}</span>}
            </div>

            <div className='d-flex justify-content-between input_width'>
                <div className="input_div d-flex flex-column">
                    <label>Product Price</label>
                    <input
                        type="number"
                        value={formData.product_price}
                        onChange={handleInputs}
                        name="product_price"
                        style={{ width: '157px' }}
                    />
                    {errors.product_price && <span style={{ color: 'red', fontSize: '0.8rem' }}>{errors.product_price}</span>}
                </div>
                <div className="input_div d-flex flex-column ms-2">
                    <label>Total Pieces Price</label>
                    <input
                        type="number"
                        value={formData.pieces_price}
                        name="pieces_price"
                        style={{ width: '157px' }}
                        disabled
                    />
                    {errors.pieces_price && <span style={{ color: 'red', fontSize: '0.8rem' }}>{errors.pieces_price}</span>}
                </div>
            </div>

            <div className="input_div d-flex flex-column input_width">
                <label>Pieces</label>
                <input
                    type="number"
                    value={formData.stock}
                    onChange={handleInputs}
                    name="stock"
                />
                {errors.stock && <span style={{ color: 'red', fontSize: '0.8rem' }}>{errors.stock}</span>}
            </div>

            <div className="input_div d-flex flex-column input_width">
                <label>Product Date</label>
                <input
                    type="date"
                    value={formData.date}
                    onChange={handleInputs}
                    name="date"
                />
                {errors.date && <span style={{ color: 'red', fontSize: '0.8rem' }}>{errors.date}</span>}
            </div>

            <div className="btn_wrapper mt-2 mt-xxl-5 mt-xl-5 mt-lg-5 mt-md-5 mb-5">
                <button
                    type="submit"
                    className="btn btn-danger input_width"
                    disabled={isLoading}
                >
                    {isLoading ? 'Adding...' : 'Add Product'}
                </button>
            </div>
        </form>
    );
};

export default BuyerProductCard;
