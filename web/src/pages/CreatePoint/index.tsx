import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { Map, TileLayer, Marker } from 'react-leaflet';
import api from '../../services/api';
import { LeafletMouseEvent } from 'leaflet'
import axios from 'axios';

import './styles.css'
import logo from '../../assets/logo.svg'
import Dropzone from '../../components/Dropzone'

interface Item 
{
    id: number;
    title: string;
    image_url: string;
}

interface IBGEUF 
{
    sigla: string;
    nome: string;
}

interface IBGECidades 
{
    nome: string;
}

const CreatePoint = () =>
{
    const [items, setItems] = useState<Item[]>([]);
    const [estados, setEstados] = useState<IBGEUF[]>([]);
    const [cities, setCities] = useState<IBGECidades[]>([]);
    const sUrl = 'http://localhost:3333';

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        whatsapp: ''
    });
    const [initialPosition, setInitialPosition] = useState<[number, number]>([0, 0]);
    
    const [selectedUF, setSelectedUF] = useState('0');
    const [selectedCity, setSelectedCity] = useState('0');
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [selectedPosition, setSelectedPosition] = useState<[number, number]>([0, 0]);
    const [selectedFile, setSelectedFile] = useState<File>();
    const history = useHistory();


    function handleSelectUf(event: ChangeEvent<HTMLSelectElement>)
    {
        let uf = event.target.value;

        setSelectedUF(uf);
    };

    function handleSelectCity(event: ChangeEvent<HTMLSelectElement>)
    {
        let city = event.target.value;
        setSelectedCity(city);
    };

    function handleMapClick(event: LeafletMouseEvent)
    {
        setSelectedPosition([
            event.latlng.lat,
            event.latlng.lng
        ]);
    };

    function handleInputChange(event: ChangeEvent<HTMLInputElement>)
    {
        let { name, value } = event.target;
        setFormData({ ...formData, [name]: value })
    };

    function handleSelectItem(id: number)
    {
        let alreadySelected = selectedItems.findIndex(item => item === id);

        if (alreadySelected >= 0)
        {
            let filteredItems = selectedItems.filter(item => item !== id);

            setSelectedItems(filteredItems);
        }
        else
        {
            setSelectedItems([ ...selectedItems, id ]);
        }
    };

    async function handleSubmit(event: FormEvent)
    {
        event.preventDefault();
        
        const { name, email, whatsapp } = formData;
        const uf = selectedUF;
        const city = selectedCity;
        const [latitude, longitude] = selectedPosition;
        const items = selectedItems;
 
        const data = new FormData();
        
        data.append('name', name);
        data.append('email', email);
        data.append('whatsapp', whatsapp);
        data.append('uf', uf);
        data.append('city', city);
        data.append('latitude', String(latitude));
        data.append('items', items.join(','));
        data.append('items', items.join(','));
        data.append('items', items.join(','));
        data.append('longitude', String(longitude));        
        data.append('items', items.join(','));
        

        await api.post(`${sUrl}/points`, data);
        alert('SALVOU PORRA');
        history.push(`/`);
    };

    useEffect(() => 
    {
        navigator.geolocation.getCurrentPosition(position => 
        {
            const { latitude, longitude } = position.coords;

            setInitialPosition([latitude, longitude]);
        })
    }, []);

    useEffect(() => 
    {
        api.get('items').then(response => 
        {
            setItems(response.data);
        });
    }, []);

    useEffect(() => 
    {
        axios.get<IBGEUF[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados').then(response => 
        {       
            setEstados(response.data);            
        });
    }, []);

    useEffect(() => 
    {
        if (selectedUF === '0')
        {
            return;
        }

        axios.get<IBGECidades[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUF}/municipios`)
        .then(response => 
        {       
            setCities(response.data);            
        });
    }, [selectedUF]);

    return (
        <div id="page-create-point">
            <header>
                <img src={logo} alt="Ecoleta"/>

                <Link to="/">
                    <FiArrowLeft />
                    Voltar para Home
                </Link>                
            </header>

            <form onSubmit={handleSubmit}>
                <h1> Cadastro do <br /> Ponto de Coleta </h1>

                    <Dropzone onFileUploaded={setSelectedFile} />

                <fieldset>
                    <legend>
                        <h2> Dados </h2>
                    </legend>

                    <div className="field">
                        <label htmlFor="name"> Nome </label>
                        <input type="text" name="name" id="name" onChange={handleInputChange}/>
                    </div>

                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="email">Email</label>
                            <input type="email" name="email" id="email" onChange={handleInputChange} />
                        </div>
                        <div className="field">
                            <label htmlFor="whatsapp">Whatsapp</label>
                            <input type="text" name="whatsapp" id="whatsapp" onChange={handleInputChange} />
                        </div>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>
                        <h2> Endereço </h2>
                        <span> Selecione o endereço no mapa </span>
                    </legend>

                    <Map center={initialPosition} zoom={15} onClick={handleMapClick}>
                        <TileLayer
                            attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        <Marker position={selectedPosition} />
                    </Map>

                    <div className="field-group">

                        <div className="field">
                            <label htmlFor="uf">Estado</label>
                            <select name="uf" id="uf" value={selectedUF} onChange={handleSelectUf}>
                                <option value="0"> Selecione um estado...</option>
                                {
                                estados.map(uf => 
                                {
                                    return (
                                        <option value={uf.sigla} key={uf.sigla}>
                                            {uf.nome}
                                        </option>
                                    );
                                })
                                }
                            </select>
                        </div>

                        <div className="field">
                            <label htmlFor="city">Cidade</label>
                            <select name="city" id="city" value={selectedCity} onChange={handleSelectCity}>
                                <option value="0">Selecione uma cidade</option>
                                {
                                    cities.map(city =>
                                    {
                                        return (
                                            <option value={city.nome} key={city.nome}>
                                                {city.nome}
                                            </option>
                                        );
                                    })
                                }
                            </select>
                        </div>

                    </div>
                </fieldset>

                <fieldset>
                    <legend>
                        <h2> Itens de Coleta </h2>
                        <span>Selecione um ou mais itens abaixo</span>
                    </legend>

                    <ul className="items-grid">
                        {items.map(item => {
                            return (
                            <li key={item.id} 
                                className={selectedItems.includes(item.id) ? 'selected' : ''}
                                onClick={() => handleSelectItem(item.id)}>
                                <img src={item.image_url} alt={item.title}/>
                                <span>{item.title}</span>
                            </li>
                            );
                        })}
                        
                    </ul>
                </fieldset>

                <button type="submit"> Cadastrar Ponto de Coleta </button>
            </form>
        </div>
    )
}

export default CreatePoint;