<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Notice</title>
</head>
<body style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #4F46E5;">New Notice</h1>
    <p>Hello {{ $user->name }},</p>
    <p>A new notice has been published:</p>
    <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <h2 style="margin-top: 0;">{{ $notice->title }}</h2>
        <div style="white-space: pre-wrap;">{{ Str::limit($notice->description, 500) }}</div>
    </div>
    <p>
        <a href="{{ url('/notices/' . $notice->id) }}" style="display: inline-block; background: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px;">View Notice</a>
    </p>
    <p style="color: #6b7280; font-size: 14px;">This is an automated message from your school management system.</p>
</body>
</html>
