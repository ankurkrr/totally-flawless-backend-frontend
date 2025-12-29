const IsEmailExistService = require('../services/isEmailExistService');

module.exports.IsEmailExistController =async(req,res) =>{
    try{ 
        const response = await IsEmailExistService.IsEmailExist(req,res);
        return response;
    }catch(err){
        throw err;
    }
}