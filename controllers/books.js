const db = require("../models");
const Book = db.books;
const File = db.files;

module.exports.createBook = async (req, res) => {
    // Validate request

    // Create a Book
    const book = {
        title: req.body.title,
        author: req.body.author,
        isbn: req.body.isbn,
        published_date: req.body.published_date,
        user_id: req.user.id,
    };

    let created = false;
    let existed = false;

    // check if this book is created
    await Book.findOne(
        {
            where: {
                isbn: book.isbn,
            }
        })
        .then(num => {
            if (num && num.length !== 0) {
                existed = true;
                res.status(400).send({
                    message: "This book has been created."
                });
            }
        })
    if (!existed) {
        // Save Book in the database
        await Book.create(book)
            .then(data => {
                created = true;
            })
            .catch(err => {
                res.status(400).send({
                    message:
                        err.message || "Some error occurred while creating the Book."
                });
            });
    }

    if (created) {
        const newBook = await Book.findOne(
            {
                //raw: true,
                where: {
                    isbn: book.isbn,
                },
                include: [
                    {
                        model: db.files
                    }
                ]
            })
            .then(book => {
                const newObj = {
                    id: book.id,
                    title: book.title,
                    author: book.author,
                    isbn: book.isbn,
                    published_date: book.published_date,
                    book_created: book.book_created,
                    user_id: book.user_id,
                    book_images: book.files.map(image => {
                        return Object.assign(
                            {},
                            {
                                file_name: image.file_name,
                                s3_object_name: image.s3_object_name,
                                file_id: image.file_id,
                                created_date: image.created_date,
                                user_id: image.user_id
                            }
                        )
                    })
                }
                return newObj;
            });
        // 201 Created
        res.status(201).send(newBook);
    }
}


module.exports.showBook = async (req, res) => {
    const id = req.params.id;
    const book = await Book.findOne(
        {
            where: {
                id: id
            },
            include: [
                {
                    model: db.files
                }
            ]
        })
        .then(book => {
            if(book === null) {
                return Promise.reject();
            }

            const newObj = {
                id: book.id,
                title: book.title,
                author: book.author,
                isbn: book.isbn,
                published_date: book.published_date,
                book_created: book.book_created,
                user_id: book.user_id,
                book_images: book.files.map(image => {
                    return Object.assign(
                        {},
                        {
                            file_name: image.file_name,
                            s3_object_name: image.s3_object_name,
                            file_id: image.file_id,
                            created_date: image.created_date,
                            user_id: image.user_id
                        }
                    )
                })
            }
            return newObj;
        })
        .catch(err => {
            res.status(400).send({
                message: `Cannot find the book with id: ${id}`
            })
        })

    if (book) {
        res.send(book);
    } else {
        res.status(400).send({
            message: `Cannot find the book with id: ${id}`
        })
    }
}


module.exports.showAllBook = async (req, res) => {
    const books = await Book.findAll({
        include: [
            {
                model: db.files
            }
        ]
    })
        .then(books => {
            const resObj = books.map(book => {
                return Object.assign(
                    {},
                    {
                        id: book.id,
                        title: book.title,
                        author: book.author,
                        isbn: book.isbn,
                        published_date: book.published_date,
                        book_created: book.book_created,
                        user_id: book.user_id,
                        book_images: book.files.map(image => {
                            return Object.assign(
                                {},
                                {
                                    file_name: image.file_name,
                                    s3_object_name: image.s3_object_name,
                                    file_id: image.file_id,
                                    created_date: image.created_date,
                                    user_id: image.user_id
                                }
                            )
                        })
                    }
                )

            })

            return resObj;
        })
    if (books) {
        res.send(books);
    }
}


module.exports.deleteBook = async (req, res) => {
    const id = req.params.id;

    let book = await Book.findOne(
        {
            where: {
                id: id,
            }
        })

    if (!book) {
        res.status(404).send({
            message: `Cannot find the book with id: ${id}`
        })
        return;
    }

    
    if(book.user_id !== req.user.id) {
        res.status(401).send({
            message: `Unauthorized Action.`
        }) 
        return;
    }

    await File.destroy(
        {
            where: {
                book_id: id,
            }
        }
    )

    await Book.destroy(
        {
            where: {
                id: id,
            }
        }
    )

    book = await Book.findOne(
        {
            where: {
                id: id,
            }
        })

    if (!book) {
        res.status(204).send({
            message: `Deleted.`
        });
    }
    return;

}