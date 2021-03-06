const mysql = require("mysql");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

exports.register = (req, res) => {
    console.log(req.body);

    const { nis, nama, email, password, passwordCek, alamat, no_tlpn } = req.body;

    db.query('SELECT email FROM siswa WHERE email = ?', [email], async (error, result) => {
        if(error) {
            console.log(error);
        } 
        if(result.length > 0) {
            return res.render('register', {
                pesan: 'That email is already in use'
            });
        } else if( password !== passwordCek) {
            return res.render('register', {
                pesan: 'Password do not match'
            });
        }

        let hashedPassword = await bcrypt.hash(password, 8);
        console.log(hashedPassword)

        db.query('INSERT INTO siswa SET ?', {nis: nis, nama: nama, email: email, password: hashedPassword ,alamat: alamat, no_tlpn: no_tlpn}, (error, result) =>{
            if(error){
                console.log(error);
            } else {
                console.log(result);
                return res.render('register', {
                    pesan: 'User registered'
                });
            }
        });
    });
}

exports.login = async (req, res) => {
    try {
        const {email, password} = req.body;

        if( !email || !password ) {
            return res.status(400).render('login', {
                pesan: 'Please fill out the form'
            });
        }

        db.query('SELECT * FROM siswa WHERE email = ?', [email], async (error, result) => {
            console.log(result);
            if( !result || !(await bcrypt.compare(password, result[0].password) )) {
                res.status(401).render('login', {
                    pesan: 'Email or Password is incorrect'
                });
            } else {
                const nisn = result[0].nisn;

                const token = jwt.sign({ nisn }, process.env.JWT_SECRET, {
                    expiresIn: process.env.JWT_EXPIRES_IN
                });

                console.log("The token is: " + token);

                const cookieOptions = {
                    expires: new Date(
                        Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
                    ),
                    httpOnly: true
                }

                res.cookie('jwt', token, cookieOptions);
                res.status(200).redirect("/profile");
            }

        });
    } catch (error) {
        console.log(error);
    }
}

exports.loginPetugas = async (req, res) => {
    try {
        const {email, password} = req.body;

        if( !email || !password ) {
            return res.status(400).render('login_petugas', {
                pesan: 'Please fill out the form'
            });
        }

        db.query('SELECT * FROM petugas WHERE email = ?', [email], async (error, result) => {
            console.log(result);
            if( !result || !(await bcrypt.compare(password, result[0].password) )) {
                res.status(401).render('login_petugas', {
                    pesan: 'Email or Password is incorrect'
                });
            } else {
                const id = result[0].id;

                const token = jwt.sign({ id }, process.env.JWT_SECRET, {
                    expiresIn: process.env.JWT_EXPIRES_IN
                });

                console.log("The token is: " + token);

                const cookieOptions = {
                    expires: new Date(
                        Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
                    ),
                    httpOnly: true
                }

                res.cookie('jwt', token, cookieOptions);
                res.status(200).redirect("/");
            }

        });
    } catch (error) {
        console.log(error);
    }
}