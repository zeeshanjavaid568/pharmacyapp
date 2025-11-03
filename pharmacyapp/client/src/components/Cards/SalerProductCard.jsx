import React, { useState } from 'react';
import { useCreateSalerProductMutation } from '../../redux/features/SalerProductApi/salerProductApi';
import { useBuyerProductQuery, useUpdateBuyerProductMutation } from '../../redux/features/BuyerProductApi/buyerProductApi';
import Swal from 'sweetalert2/dist/sweetalert2';

const SalerProductCard = ({ onProductAdded }) => {
    const [formData, setFormData] = useState({
        product_name: '',
        product_price: '',
        pieces_price: '',
        stock: '',
        date: ''
    });
    const [errors, setErrors] = useState({});

    // Fetch buyer products
    const { data: buyerProducts } = useBuyerProductQuery();
    const [createSalerProduct, { isLoading }] = useCreateSalerProductMutation();
    const [updateBuyerProduct] = useUpdateBuyerProductMutation();

    const handleInputs = (e) => {
        const { name, value } = e.target;

        // Update the form data
        const updatedFormData = { ...formData, [name]: value };

        // Calculate the pieces price (product_price * stock)
        if (name === 'product_price' || name === 'stock') {
            const productPrice = Number(updatedFormData.product_price || 0);
            const stock = Number(updatedFormData.stock || 0);
            updatedFormData.pieces_price = productPrice * stock;
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

        // Validate Current Stock
        if (!formData.stock || Number(formData.stock) <= 0) {
            validationErrors.stock = 'Stock must be greater than zero.';
        }

        // Validate Product Date
        if (!formData.date) {
            validationErrors.date = 'Please select a valid product date.';
        }

        // Check if there are validation errors
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setErrors({});

        // Match saler product with buyer product by name
        const matchedBuyerProducts = buyerProducts?.filter(
            (buyer) => buyer.product_name === formData.product_name
        );

        if (matchedBuyerProducts?.length > 0) {
            const lastBuyerProduct = matchedBuyerProducts[matchedBuyerProducts.length - 1]; // Get last matched product

            // Check price condition
            if (Number(formData.product_price) < Number(lastBuyerProduct.product_price)) {
                Swal.fire({
                    title: 'Error!',
                    text: `Seller product price cannot be less than buyer product price (Rs ${lastBuyerProduct.product_price}).`,
                    icon: 'error',
                    confirmButtonText: 'Ok',
                    buttonsStyling: false,
                    customClass: {
                        confirmButton: 'sweetalert_btn_error',
                    },
                });
                return;
            }

            // Subtract stock and update the buyer product in the database
            const updatedStock = Number(lastBuyerProduct.stock) - Number(formData.stock);

            if (updatedStock < 0) {
                Swal.fire({
                    title: 'Error!',
                    text: 'Not enough stock available in buyer product.',
                    icon: 'error',
                    confirmButtonText: 'Ok',
                    buttonsStyling: false,
                    customClass: {
                        confirmButton: 'sweetalert_btn_error',
                    },
                });
                return;
            }

            try {
                // Update buyer product stock
                await updateBuyerProduct({
                    id: lastBuyerProduct.id, // Assuming there's an ID field
                    userData: { stock: updatedStock }
                }).unwrap();

                // Save saler product data
                await createSalerProduct(formData).unwrap();
                localStorage.setItem('saler_pieces', formData.stock);
                localStorage.setItem('saler_date', formData.date);
                Swal.fire({
                    title: 'Success',
                    text: 'Saler Product Added Successfully.',
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

                onProductAdded();
            } catch (error) {
                Swal.fire({
                    title: 'Error!',
                    text: 'Something went wrong.',
                    icon: 'error',
                    confirmButtonText: 'Ok',
                    buttonsStyling: false,
                    customClass: {
                        confirmButton: 'sweetalert_btn_error',
                    },
                });
            }
        } else {
            Swal.fire({
                title: 'Error!',
                text: 'No matching buyer product found.',
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
        <form className="product_form form_div" style={{height: '618px'}} onSubmit={handleSubmit}>
            <h2 className="mt-5 mb-5 card-title gradient_text">Add Saler Product</h2>

            <div className="input_div d-flex flex-column input_width">
                <label>Product Name</label>
                <input
                    type="text"
                    value={formData.product_name}
                    onChange={handleInputs}
                    name="product_name"
                />
                {errors.product_name && <span style={{ color: 'red' }}>{errors.product_name}</span>}
            </div>

            <div className="d-flex justify-content-between input_width">
                <div className="input_div d-flex flex-column">
                    <label>Product Price</label>
                    <input
                        type="number"
                        value={formData.product_price}
                        onChange={handleInputs}
                        name="product_price"
                        style={{ width: '157px' }}
                    />
                    {errors.product_price && <span style={{ color: 'red' }}>{errors.product_price}</span>}
                </div>
                <div className="input_div d-flex flex-column ms-2">
                    <label>Total Pieces Price</label>
                    <input
                        type="number"
                        value={formData.pieces_price}
                        onChange={handleInputs}
                        name="pieces_price"
                        style={{ width: '157px' }}
                        disabled
                    />
                    {errors.pieces_price && <span style={{ color: 'red' }}>{errors.pieces_price}</span>}
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
                {errors.stock && <span style={{ color: 'red' }}>{errors.stock}</span>}
            </div>

            <div className="input_div d-flex flex-column input_width">
                <label>Product Date</label>
                <input
                    type="date"
                    value={formData.date}
                    onChange={handleInputs}
                    name="date"
                />
                {errors.date && <span style={{ color: 'red' }}>{errors.date}</span>}
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

export default SalerProductCard;