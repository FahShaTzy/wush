import {
    Mesh,
    CylinderGeometry,
    MeshPhongMaterial,
    Group
} from "three";

class Pohon {

    constructor() {

        this.adalahPohon = true;

        const pohon = new Group();
        const batang = new Mesh(
            new CylinderGeometry( 0.5, 0.5, 12, 16 ),
            new MeshPhongMaterial( { color: "brown" } )
        );
        const daun1 = new Mesh(
            new CylinderGeometry( 0.5, 5, 5, 32 ),
            new MeshPhongMaterial( { color: "green" } )
        );
        const daun2 = new Mesh(
            new CylinderGeometry( 0.5, 5, 5, 16),
            new MeshPhongMaterial( { color: "green" } )
        );
        const daun3 = new Mesh(
            new CylinderGeometry( 0, 5, 7, 8 ),
            new MeshPhongMaterial( { color: "green" } )
        );

        batang.position.set( 0, 6, 0 );
        batang.castShadow = true;
        batang.receiveShadow = true;

        daun1.position.set( 0, 5.5, 0 );
        daun1.castShadow = true;
        daun1.receiveShadow = true;

        daun2.position.set( 0, 9.5, 0 );
        daun2.castShadow = true;
        daun2.receiveShadow = true;

        daun3.position.set( 0, 14.5, 0 );
        daun3.castShadow = true;
        daun3.receiveShadow = true;

        pohon.add( batang ).add( daun1 ).add( daun2 ).add( daun3 );

        return pohon;
    }
}

export { Pohon }