export const PG_CONFIG = {
    host: 'localhost',
    port: 5432, /*ATTENTION Modifié temporairement pour Alex car mon postgresql est sur ce port. Remplacez ça par 5432 si vous utilisez ma branche*/
    database: 'supfile',
    user: 'postgres',
    password: 'user'
};

export const PORT = process.env.PORT || 3000;
