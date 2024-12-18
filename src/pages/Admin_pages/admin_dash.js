import React from 'react';
import AdmdashWelcome from '../../components/admin_components/admin_dashWel_comp';
import AdmHeader from './admin_header';
import Footer from '../../components/layouts/Footer';
class AdminDash extends React.Component{
    render(){
       return(
        <div>
        <AdmHeader/>
        <AdmdashWelcome/>
        <Footer/>
        </div>
        
       )
    }
}

export default AdminDash