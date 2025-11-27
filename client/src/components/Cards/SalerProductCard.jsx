import React, { useState, useEffect } from 'react';
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
    const [matchedBuyerProduct, setMatchedBuyerProduct] = useState(null);

    // Fetch buyer products
    const { data: buyerProducts } = useBuyerProductQuery();
    const [createSalerProduct, { isLoading }] = useCreateSalerProductMutation();
    const [updateBuyerProduct] = useUpdateBuyerProductMutation();

    // Function to format date to DD-MM-YYYY
    const formatDate = (dateString) => {
        if (!dateString) return '';

        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString; // Return original if invalid date

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return `${day}-${month}-${year}`;
    };

    // Effect to find matching buyer product when product name changes
    useEffect(() => {
        if (formData.product_name.trim() && buyerProducts) {
            const matchedProducts = buyerProducts.filter(
                (buyer) => buyer.product_name.toLowerCase() === formData.product_name.toLowerCase()
            );

            if (matchedProducts.length > 0) {
                const lastMatchedProduct = matchedProducts[matchedProducts.length - 1];
                setMatchedBuyerProduct(lastMatchedProduct);

                // Auto-fill the product price from buyer product
                setFormData(prev => ({
                    ...prev,
                    product_price: lastMatchedProduct.saling_price || ''
                }));
            } else {
                setMatchedBuyerProduct(null);
                // Reset product price if no match found
                setFormData(prev => ({
                    ...prev,
                    product_price: ''
                }));
            }
        } else {
            setMatchedBuyerProduct(null);
        }
    }, [formData.product_name, buyerProducts]);

    const handleInputs = (e) => {
        const { name, value } = e.target;

        // Update the form data
        const updatedFormData = { ...formData, [name]: value };

        // Calculate the pieces price (product_price * stock)
        if (name === 'product_price' || name === 'stock') {
            const productPrice = Number(updatedFormData.product_price || 0);
            const stock = Number(updatedFormData.stock || 0);
            updatedFormData.pieces_price = (productPrice * stock).toString();
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

        // Check if product name matches with buyer product
        if (!matchedBuyerProduct) {
            Swal.fire({
                title: 'Error!',
                text: 'No matching buyer product found. Please enter a valid product name.',
                icon: 'error',
                confirmButtonText: 'Ok',
                buttonsStyling: false,
                customClass: {
                    confirmButton: 'sweetalert_btn_error',
                },
            });
            return;
        }

        // Check price condition
        if (Number(formData.product_price) < Number(matchedBuyerProduct.product_price)) {
            Swal.fire({
                title: 'Error!',
                text: `Seller product price cannot be less than buyer product price (Rs ${matchedBuyerProduct.product_price}).`,
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
        const updatedStock = Number(matchedBuyerProduct.stock) - Number(formData.stock);

        if (updatedStock < 0) {
            Swal.fire({
                title: 'Error!',
                text: `Not enough stock available in buyer product. Available stock: ${matchedBuyerProduct.stock}`,
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
                id: matchedBuyerProduct.id,
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

            setMatchedBuyerProduct(null);
            setErrors({});

            onProductAdded();
        } catch (error) {
            Swal.fire({
                title: 'Error!',
                text: 'Something went wrong while adding the product.',
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
        <form className="product_form form_div" onSubmit={handleSubmit}>
            <h2 className="mt-5 mb-5 card-title gradient_text">Add Saler Product</h2>

            <div className="input_div d-flex flex-column input_width">
                <label>Product Name</label>
                <input
                    type="text"
                    value={formData.product_name}
                    onChange={handleInputs}
                    name="product_name"
                    placeholder="Enter product name"
                />
                {errors.product_name && <span style={{ color: 'red' }}>{errors.product_name}</span>}

                {/* Display matched buyer product details */}
                {matchedBuyerProduct && (
                    <div className="buyer-product-info mt-2 p-3" style={{
                        border: '1px solid #28a745',
                        borderRadius: '5px',
                        backgroundColor: '#f8fff9'
                    }}>
                        <h6 style={{ color: '#28a745', marginBottom: '10px' }}>
                            ✅ Matching Buyer Product Found
                        </h6>
                        <div className="row">
                            <div className="col-6">
                                <strong>Saling Price:</strong> Rs {matchedBuyerProduct.saling_price}
                            </div>
                            <div className="col-6">
                                <strong>Available Stock:</strong> {matchedBuyerProduct.stock}
                            </div>
                        </div>
                        {matchedBuyerProduct.date && (
                            <div className="row mt-2">
                                <div className="col-12">
                                    <strong>Expire Date:</strong> {formatDate(matchedBuyerProduct.date)}
                                </div>
                            </div>
                        )}
                    </div>
                )}
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
                        placeholder="Enter price"
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
                    placeholder="Enter quantity"
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