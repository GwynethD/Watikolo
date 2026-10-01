# Watikolo New Process Specification

## 1. Purpose

This specification defines the booking and administration process for the Watikolo booking system. It covers public online reservations, admin-managed walk-in bookings, payment verification, booking status updates, and schedule availability rules.

## 2. Scope

The process applies to:

- Public users browsing venues, packages, rooms, and booking options.
- Guests submitting online booking requests.
- Admin users reviewing, approving, rejecting, cancelling, and completing bookings.
- Admin users creating walk-in bookings.
- System services that store booking data, validate availability, upload payment proof, create notifications, and send booking emails.

## 3. Actors

| Actor | Responsibility |
| --- | --- |
| Public Guest | Selects a package or room, enters guest details, uploads payment proof, and submits a booking request. |
| Admin User | Reviews bookings, verifies payment details, updates booking status, and creates walk-in bookings. |
| System | Validates data, checks availability, calculates totals, records bookings, creates notifications, and sends email updates. |

## 4. Main Booking Statuses

| Status | Meaning |
| --- | --- |
| `pending` | Booking request has been submitted and is awaiting admin review. |
| `approved` | Admin has verified the booking and confirmed the reservation. |
| `completed` | Booking has finished or has been marked as fulfilled. |
| `cancelled` | Booking was cancelled after submission or approval. |
| `rejected` | Booking request was not approved by admin. |

## 5. Public Online Booking Process

### 5.1 Entry Points

Guests can start a booking from:

- `/booking`
- Venue/package links that pass booking details through URL parameters.
- Room booking links that pass room name, price, included guests, and check-in date.

### 5.2 Step 1: Confirmation and Extras

The guest selects or confirms:

- Booking mode: package or room.
- Venue or room.
- Event date or room check-in date.
- Room check-out date, when booking a room.
- Time slot and preferred start time, when booking a package.
- Package inclusions.
- Add-ons, when allowed for the selected package.
- Extra guests, extra beds, or additional hours.

The system calculates:

- Base package or room total.
- Number of room nights.
- Add-on total.
- Extra guest, extra bed, or additional hour charges.
- Total booking amount.
- Required 30% down payment.

### 5.3 Step 2: Guest Details

The guest enters:

- First name.
- Last name.
- Gmail or Googlemail address.
- Phone number.

Validation rules:

- Name is required.
- Email must be a Gmail or Googlemail address.
- Phone number is required.
- A guest with the same normalized name cannot have another active `pending` or `approved` booking.

### 5.4 Step 3: Payment

The guest provides:

- Payment method.
- Amount paid.
- Payment reference number.
- Payment screenshot.
- Booking policy acceptance.

Validation rules:

- Amount paid must be at least 30% of the calculated total.
- Payment proof file is required.
- Payment reference number is required.
- Booking policy must be accepted.

### 5.5 Submission

When the guest confirms the booking:

1. The frontend builds a booking payload with schedule, customer, package, pricing, payment, and notes data.
2. The backend validates required booking fields.
3. The backend checks availability.
4. If payment proof storage is enabled, the proof image is uploaded and linked to the booking.
5. The booking is created with status `pending`.
6. A booking reference is generated.
7. An admin notification is created.
8. A pending booking email is sent to the guest.
9. The guest is routed to the booking success page.

## 6. Availability Rules

### 6.1 Active Bookings

A booking blocks availability when its status is not:

- `cancelled`
- `rejected`

### 6.2 Package Slot Availability

For package bookings:

- If another active booking exists for the same venue, date, and time slot, the slot is unavailable.
- If the conflicting booking is `pending`, the slot is treated as reserved.
- If the conflicting booking is `approved` or `completed`, the slot is treated as booked.

### 6.3 Whole-Property Package Availability

Whole-property packages include package indexes `3`, `4`, and `5`, or packages named:

- Deluxe
- Grand
- Ultimate

Rules:

- A whole-property package cannot be booked if any active booking exists on the same date.
- If a whole-property package already exists on a date, other package and room bookings for that date are blocked.

### 6.4 Room Availability

A room is unavailable when, on the same date, an active booking:

- Books that room directly.
- Includes that room as a room add-on.
- Has notes indicating that room was selected as a room add-on.
- Uses a whole-property package that includes rooms.

## 7. Admin Booking Management Process

### 7.1 Booking Review

Admin users access booking management from:

- `/admin/bookings`

The admin can:

- View all bookings.
- Filter by status.
- Open booking details.
- Review schedule, guest information, selected package or room, payment proof, payment amount, and balance.

### 7.2 Status Updates

Admin users can update a booking to:

- `approved`
- `completed`
- `cancelled`
- `rejected`

When status changes to `approved`, `rejected`, or `cancelled`, the system sends a booking status email to the guest.

### 7.3 Deposit Updates

Admin users can update the booking deposit amount. The system recalculates the remaining balance from:

```text
remaining balance = total booking amount - deposit amount
```

## 8. Admin Walk-In Booking Process

### 8.1 Entry Point

Admin users create walk-in bookings from the booking management page.

### 8.2 Walk-In Types

Supported walk-in booking types:

- Package
- Room
- Pool use

### 8.3 Walk-In Details

Admin enters:

- Customer name.
- Phone number.
- Optional email.
- Date or room check-in/check-out dates.
- Package, room, or pool use selection.
- Guest count.
- Payment method.
- Payment type: 30% down payment or full payment.
- Payment reference number when method is not cash.

### 8.4 Walk-In Calculation

The system calculates:

- Base package, room, or pool amount.
- Room nights.
- Extra guest charges.
- Extra bed charges.
- Additional hour charges.
- Add-on charges.
- Payment amount.
- Remaining balance.

### 8.5 Walk-In Save

When the admin saves a walk-in:

1. The system validates required fields.
2. The system checks schedule or room availability.
3. A booking is created with status `pending`.
4. Payment details are stored in notes and deposit fields.
5. The booking appears in the admin booking list.

## 9. Data Outputs

Each booking record stores:

- Booking ID.
- Booking reference.
- Venue ID and name.
- Booking mode.
- Package or room name.
- Room add-ons.
- Customer name, email, and phone.
- Date.
- Time slot and preferred start time.
- Guest count.
- Event type.
- Total price.
- Deposit amount.
- Payment proof name, URL, or storage path.
- Status.
- Creation date.
- Notes.

Each new booking also creates:

- Admin notification.
- Email log entry when email sending is attempted.

## 10. Exceptions and Error Handling

| Condition | System Response |
| --- | --- |
| Missing required booking fields | Reject request with validation error. |
| Non-Gmail customer email | Reject request with validation error. |
| Unavailable date, slot, or room | Reject request with conflict message. |
| Payment below 30% minimum | Block submission until corrected. |
| Missing payment proof or reference | Block submission until corrected. |
| Admin updates non-existing booking | Return booking not found error. |
| Email service unavailable | Booking continues, and email failure is logged. |

## 11. Completion Criteria

The process is complete when:

- Guest booking requests are stored as `pending`.
- Admin can review and update booking status.
- Approved bookings block their date, slot, or room according to availability rules.
- Rejected and cancelled bookings no longer block availability.
- Guests receive email notifications for submission, approval, rejection, and cancellation when email service is configured.

## 12. Process Specification

### 12.1 Customer Online Booking Process

```text
Begin
    Customer/User opens the Watikolo website
    Customer/User views resort information, accommodations, gallery, reviews, and contact details
    Customer/User selects a booking option

    If booking type = Event Package
        Display available event packages
        Input selected event package
        Input event date
        Input time slot
        Input preferred start time
        Input extra guests, additional hours, and add-ons if applicable
    Else if booking type = Room
        Display available rooms
        Input selected room
        Input check-in date
        Input check-out date
        Input number of guests
        Input extra bed if applicable
    End if

    System checks selected date, time slot, package, room, and add-on availability

    If selected schedule or room is available
        System calculates package or room rate, add-on charges, extra guest charges, and total amount
        System displays the Booking Summary

        Input customer first name
        Input customer last name
        Input Gmail address
        Input phone number

        If customer information is valid and no duplicate active booking exists
            Input payment method
            Input payment amount
            Input payment reference number
            Upload payment proof
            Accept booking policy

            If payment amount is at least 30% of total amount and payment proof is uploaded
                Submit booking request
                Generate booking reference
                Save booking status as Pending
                Create admin notification
                Send booking request email to customer
                Display booking success page
            Else
                Display "Payment amount, reference number, and payment proof are required"
            End if
        Else
            Display "Invalid customer information or duplicate active booking"
        End if
    Else
        Display "Selected schedule or room is unavailable"
    End if
End
```

### 12.2 Administrator Booking Management Process

```text
Begin
    Administrator opens Admin Login page
    Input admin username or email
    Input admin password

    If admin credentials are valid
        Grant access to Admin Dashboard
        Administrator opens Manage Bookings page
        System displays booking list
        Administrator selects booking record
        System displays booking details, payment proof, deposit amount, total amount, and balance
        Administrator reviews and verifies booking request

        If booking details and payment proof are valid
            Administrator approves booking
            System updates booking status to Approved
            System updates venue, room, or schedule availability
            System sends booking confirmation email to customer
        Else if booking cannot be accepted
            Administrator rejects booking
            System updates booking status to Rejected
            System releases affected availability
            System sends rejection email to customer
        Else if booking is cancelled
            Administrator cancels booking
            System updates booking status to Cancelled
            System releases affected availability
            System sends cancellation email to customer
        Else if booking service is completed
            Administrator marks booking as Completed
            System updates booking status to Completed
            System records the total booking amount as paid
            System updates the remaining balance to zero
        End if
    Else
        Display "Invalid Credentials"
    End if
End
```

### 12.3 Walk-in Booking Process

```text
Begin
    Walk-in customer provides booking details to administrator
    Administrator opens Manage Bookings page
    Administrator selects Create Walk-in Booking
    Input walk-in booking type

    If walk-in booking type = Package
        Input selected package
        Input booking date
        Input time slot
        Input guest count and add-ons if applicable
    Else if walk-in booking type = Room
        Input selected room
        Input check-in date
        Input check-out date
        Input number of guests and extra beds if applicable
    Else if walk-in booking type = Pool Use
        Input pool use details
    End if

    Input customer name
    Input customer phone number
    Input customer email if available
    Input payment method
    Input payment type

    If payment method is not Cash
        Input payment reference number
    End if

    System checks schedule and room availability

    If selected booking details are valid and available
        System calculates total amount, payment amount, and balance
        Save walk-in booking
        Generate booking reference
        Set booking status to Pending
        Display walk-in booking in booking list
    Else
        Display "Walk-in booking cannot be saved because details are incomplete or unavailable"
    End if
End
```

### 12.4 Reports and Records Process

```text
Begin
    Administrator opens Admin Dashboard
    Administrator selects Reports or Inventory Reports
    System retrieves booking, payment, schedule, inventory, and revenue data

    If records are available
        Display booking reports
        Display payment and revenue summaries
        Display schedule records
        Display inventory reports
    Else
        Display "No records available"
    End if
End
```
