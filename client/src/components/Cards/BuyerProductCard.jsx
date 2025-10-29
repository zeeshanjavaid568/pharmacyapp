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
        expire_date: '',
        date: ''
    });
    const [errors, setErrors] = useState({});
    const { data: buyerProducts } = useBuyerProductQuery();
    const [createBuyerProduct, { isLoading }] = useCreateBuyerProductMutation();

    // ✅ Handles all input changes including dates
    const handleInputs = (e) => {
        const { name, value } = e.target;

        setFormData((prevData) => {
            const updatedFormData = { ...prevData, [name]: value };

            // Auto-calculate total pieces price
            if (name === 'product_price' || name === 'stock') {
                const productPrice = Number(updatedFormData.product_price || 0);
                const stock = Number(updatedFormData.stock || 0);
                updatedFormData.pieces_price = productPrice * stock;
                updatedFormData.pieces = stock;
            }

            console.log("Updated formData:", updatedFormData); // ✅ logs new data including dates
            return updatedFormData;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = {};

        // Validate fields
        if (formData.product_name.trim().length < 3)
            validationErrors.product_name = 'Product name must be at least 3 characters long.';

        if (!formData.product_price || Number(formData.product_price) <= 0)
            validationErrors.product_price = 'Product price must be greater than zero.';

        if (!formData.pieces_price || Number(formData.pieces_price) <= 0)
            validationErrors.pieces_price = 'Product pieces price must be greater than zero.';

        if (!formData.stock || Number(formData.stock) <= 0)
            validationErrors.stock = 'Stock must be greater than zero.';

        if (!formData.expire_date)
            validationErrors.expire_date = 'Please select a valid product expire date.';

        if (!formData.date)
            validationErrors.date = 'Please select a valid product date.';

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setErrors({});

        try {
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

            await createBuyerProduct({ ...formData, stock: newStock }).unwrap();
            localStorage.setItem('buyer_pieces', formData.pieces);

            Swal.fire({
                title: 'Success',
                text: 'Buyer Product Added Successfully.',
                icon: 'success',
                confirmButtonText: 'Ok',
                buttonsStyling: false,
                customClass: { confirmButton: 'sweetalert_btn_success' },
            });

            // ✅ Reset form including dates
            setFormData({
                product_name: '',
                product_price: '',
                pieces_price: '',
                pieces: '',
                stock: '',
                expire_date: '',
                date: ''
            });

            if (onProductAdded) onProductAdded();
        } catch (error) {
            console.error('Error adding product:', error);
            Swal.fire({
                title: 'Error!',
                text: 'Buyer Product Not Added',
                icon: 'error',
                confirmButtonText: 'Ok',
                buttonsStyling: false,
                customClass: { confirmButton: 'sweetalert_btn_error' },
            });
        }
    };

    return (
        <form className="product_form form_div mb-4" onSubmit={handleSubmit}>
            <h2 className="mt-5 mb-5 card-title gradient_text">Add Buyer Product</h2>

            <div className="input_div d-flex flex-column input_width">
                <label>Product Name</label>
                <input type="text" name="product_name" value={formData.product_name} onChange={handleInputs} />
                {errors.product_name && <span style={{ color: 'red', fontSize: '0.8rem' }}>{errors.product_name}</span>}
            </div>

            <div className='d-flex justify-content-between input_width'>
                <div className="input_div d-flex flex-column">
                    <label>Product Price</label>
                    <input type="number" name="product_price" value={formData.product_price} onChange={handleInputs} style={{ width: '157px' }} />
                    {errors.product_price && <span style={{ color: 'red', fontSize: '0.8rem' }}>{errors.product_price}</span>}
                </div>
                <div className="input_div d-flex flex-column ms-2">
                    <label>Total Pieces Price</label>
                    <input type="number" name="pieces_price" value={formData.pieces_price} style={{ width: '157px' }} disabled />
                    {errors.pieces_price && <span style={{ color: 'red', fontSize: '0.8rem' }}>{errors.pieces_price}</span>}
                </div>
            </div>

            <div className="input_div d-flex flex-column input_width">
                <label>Pieces</label>
                <input type="number" name="stock" value={formData.stock} onChange={handleInputs} />
                {errors.stock && <span style={{ color: 'red', fontSize: '0.8rem' }}>{errors.stock}</span>}
            </div>

            <div className="input_div d-flex flex-column input_width">
                <label>Expire Date</label>
                <input type="date" name="expire_date" value={formData.expire_date} onChange={handleInputs} />
                {errors.expire_date && <span style={{ color: 'red', fontSize: '0.8rem' }}>{errors.expire_date}</span>}
            </div>

            <div className="input_div d-flex flex-column input_width">
                <label>Product Date</label>
                <input type="date" name="date" value={formData.date} onChange={handleInputs} />
                {errors.date && <span style={{ color: 'red', fontSize: '0.8rem' }}>{errors.date}</span>}
            </div>

            <div className="btn_wrapper mt-2 mb-5">
                <button type="submit" className="btn btn-danger input_width" disabled={isLoading}>
                    {isLoading ? 'Adding...' : 'Add Product'}
                </button>
            </div>
        </form>
    );
};

export default BuyerProductCard;
