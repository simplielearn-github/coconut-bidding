const ProductModel = require("../models/Products");
const AppResponse = require("../services/AppResponse")

const createProduct = async (req, res) => {
    try {
      const payload = req.body.product;
      const product = await ProductModel.create(payload)
      return AppResponse.success(res, product)
    } catch (error) {
      if(error.message.includes('E11000 duplicate key error collection')) {
        return AppResponse.conflict(
          res,
          'Product with the same name already exists',
          error.message
        )
      } else if (error.name = 'ValidationError') {
        return AppResponse.badRequest(
          res,
          'Invalid Payload',
          error.message
        )
      } else {
        return AppResponse.error(
          res,
          'INTERNAL SERVER ERROR',
          error.message
        )
      }
    }
};

const getProducts = async (req, res) => {
    try {
      const products = await ProductModel.aggregate([{
        $project: {
          producerId: 1,
          name: 1,
          _id: 1,
          basePrice: 1,
          imageUrl: 1,
          bidStartDate: 1,
          bidEndDate: 1,
          noOfUnits: 1,
          createdAt: 1,
          updatedAt: 1,
          dateDiffs: {
            $dateDiff: {
              startDate: new Date(),
              endDate: "$bidEndDate",
              unit: 'day'
              
            }
          }
        }
      }, {
        $sort: {
          dateDiffs: -1
        }
      }]);
      return AppResponse.success(res, {products})
    } catch (error) {
      return AppResponse.error(
        res,
        'INTERNAL SERVER ERROR',
        error.message
      )
    }
};

const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await ProductModel.findById(id);
        return AppResponse.success(res, {product})
    } catch (error) {
        return AppResponse.error(
            res,
            'INTERNAL SERVER ERROR',
            error.message
      )
    }
};

module.exports = {
    createProduct,
    getProducts,
    getProductById,
}