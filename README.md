# Setting up the database

Run `node seeder`.

# Running the app

Run `node index`.

# Requirements

1. A single service that has the following components (Shop | Branch | Product)
   Each components needs to have a data model that describes it well.
2. This service will expose one API for clients that will accept a (search_term), and the
   (user_coordinates) as the user current location as well as an optional filed (category_name
   or category_id) that will filter shops and products based on categories both a shop and a
   product are in. then return the following:
   o All the shops that have the search term fully or partially as part of their name:

-   Shop must be within a 5 km radios.
-   Shop must reflect open or close status depending on a schedule (a weekly
    timetable that has the open/close time for each day).
-   If category optional field is used filter based on it as well.
-   Return all resulting shops full data fields.
    o All the products that have the search term fully or partially as part of their name:
-   If category optional field is used filter based on it as well.
-   Return all resulting products full data fields.

3. The system must do the following:

-   \*Store every search attempt (API hit) as an audit record.
-   \*Make the success and failure of every step very clear for every single request in the
    system/server logs

4. Unit tests must be written for all lines of code.
5. Documentation must be included. You can use swagger or any other tool of your liking.
