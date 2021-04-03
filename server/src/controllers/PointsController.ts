import knex from '../database/connection';
import { Request, Response } from 'express';


class PointsController {
    async index(request: Request, response: Response) {
        let { city, uf, items } = request.query;
        let parsedItems = String(items)
            .split(',').map(item => Number(item.trim()));

        let points = await knex('points')
            .join('point_items', 'points.id', '=', 'point_items.point_id')
            .whereIn('point_items.item_id', parsedItems)
            .where('city', String(city))
            .where('uf', String(uf))
            .distinct()
            .select('points.*');

        const serializedPoints = points.map(point => {
            return {
                ...point,
                image_url: `http://192.168.0.112:3333/uploads/${point.image}`
            }
        })

        return response.json(serializedPoints);
    }

    async show(request: Request, response: Response) {
        // let id = request.params.id
        let { id } = request.params;

        let point = await knex('points').where('id', id).first();

        if (!point) {
            return response.status(400).json({ message: 'Point not found.' });
        }

        const serializedPoints = {
            ...point,
            image_url: `http://192.168.0.112:3333/uploads/${point.image}`
        }

        let items = await knex('items').join('point_items', 'items.id', '=', 'point_items.item_id')
            .where('point_items.point_id', id).select('items.title');

        return response.json({ point:serializedPoints, items });
    }

    async create(request: Request, response: Response) {
        let [
            name,
            email,
            whatsapp,
            longitude,
            latitude,
            city,
            uf,
            items
        ] = request.body;

        let trx = await knex.transaction();

        let point = {
            image: request.file.filename,
            name: name,
            email: email,
            whatsapp: whatsapp,
            longitude: longitude,
            latitude: latitude,
            city: city,
            uf: uf
        }

        let idInsert = await trx('points').insert(point);

        let point_id = idInsert[0];

        let pointItems = items
            .split(',')
            .map((item: String) => Number(item.trim()))
            .map((item_id: number) => {
                return {
                    item_id,
                    point_id
                }
            })
        await trx('point_items').insert(pointItems);

        await trx.commit();

        return response.json({
            id: point_id,
            ...point,
        })
    }
}

export default PointsController;