import { createClient } from 'npm:@insforge/sdk';

export default async function (req) {
  console.log('[SEND-EMAIL] Function called at', new Date().toISOString(), 'method:', req.method);
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    let { to, videoUrl, imageUrl, orderId, type } = body;
    console.log(`[SEND-EMAIL] Invoked with orderId: ${orderId}, to: ${to}, type: ${type}`);

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const BASE_URL = Deno.env.get('INSFORGE_BASE_URL');
    const ANON_KEY = Deno.env.get('ANON_KEY');

    if (!RESEND_API_KEY) {
      console.error('[SEND-EMAIL] CRITICAL: RESEND_API_KEY is missing');
      return new Response(JSON.stringify({ message: 'RESEND_API_KEY missing from server settings', error: 'Missing Key' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const client = createClient({
      baseUrl: BASE_URL,
      anonKey: ANON_KEY,
    });

    if (orderId && (!to || (!videoUrl && !imageUrl))) {
      console.log(`[SEND-EMAIL] Fetching DB details for order: ${orderId}`);
      const { data: order, error } = await client.database
        .from('orders')
        .select('email, video_url, generated_image_url')
        .eq('id', orderId)
        .single();
      
      if (error) {
          console.error('[SEND-EMAIL] DB Fetch Error:', error.message);
          // Don't throw yet, try to continue if we have partial data
      }
      
      if (order) {
        to = to || order.email;
        videoUrl = videoUrl || order.video_url;
        imageUrl = imageUrl || order.generated_image_url;
        console.log(`[SEND-EMAIL] DB Result: to=${to}, hasVideo=${!!videoUrl}`);
      }
    }

    if (!to) {
      return new Response(JSON.stringify({ error: 'to email is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const mediaLink = videoUrl || imageUrl;

    if (type !== 'welcome' && !mediaLink) {
      return new Response(JSON.stringify({ error: 'videoUrl or imageUrl is required for delivery email', body: body }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let subject = type === 'welcome' ? 'Welcome to VibeClipAI! ✨' : '🎬 Your AI Invitation Video is Ready!';
    
    let emailHtml = '';

    if (type === 'welcome') {
        emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
          </head>
          <body style="font-family: 'Segoe UI', Inter, Arial, sans-serif; margin: 0; padding: 0; background: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #6c5ce7, #a29bfe); padding: 32px 24px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">🎬 Welcome to VibeClipAI</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">The home of AI-powered video invitations</p>
              </div>

              <!-- Body -->
              <div style="padding: 32px 24px;">
                <h2 style="color: #1a1d2e; margin: 0 0 16px; font-size: 22px;">Hey there! 🎬</h2>
                <p style="color: #555; line-height: 1.6; font-size: 15px;">
                  Welcome to the family! We're thrilled to have you here. VibeClipAI helps you create stunning, professional invitation videos for any occasion with just a few clicks.
                </p>
                
                <h3 style="color: #1a1d2e; margin: 24px 0 12px; font-size: 18px;">How to get started:</h3>
                <ul style="color: #555; font-size: 14px; line-height: 1.8;">
                  <li>Browse our collection of <strong>Modern Templates</strong>.</li>
                  <li>Fill in the details for your event.</li>
                  <li>Our AI will generate your cinematic video in seconds!</li>
                </ul>

                <!-- CTA Button -->
                <div style="text-align: center; margin: 28px 0;">
                  <a href="https://4w8g54a3.insforge.site"
                     style="display: inline-block; padding: 14px 36px; background: #6c5ce7;
                            color: white; text-decoration: none; border-radius: 8px;
                            font-weight: 600; font-size: 16px;">
                    🚀 Create Your First Video
                  </a>
                </div>

                <p style="color: #888; font-size: 13px; line-height: 1.5;">
                  Happy creating,<br>The VibeClipAI Team
                </p>
              </div>

              <!-- Footer -->
              <div style="background: #f9f9f9; padding: 20px 24px; text-align: center; border-top: 1px solid #eee;">
                <p style="color: #aaa; font-size: 12px; margin: 0;">
                  © ${new Date().getFullYear()} VibeClipAI · AI-Powered Video Invitations
                </p>
              </div>
            </div>
          </body>
          </html>
        `;
    } else {
        emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
          </head>
          <body style="font-family: 'Segoe UI', Inter, Arial, sans-serif; margin: 0; padding: 0; background: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #6c5ce7, #a29bfe); padding: 32px 24px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">🎬 VibeClipAI</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">AI Video Invitation Generator</p>
              </div>

              <!-- Body -->
              <div style="padding: 32px 24px;">
                <h2 style="color: #1a1d2e; margin: 0 0 16px; font-size: 22px;">Your Video is Ready! 🎉</h2>
                <p style="color: #555; line-height: 1.6; font-size: 15px;">
                  Your AI-generated invitation video has been created and is ready to download.
                </p>

                ${orderId ? `<p style="color: #888; font-size: 13px; margin: 8px 0;"><strong>Order ID:</strong> ${orderId}</p>` : ''}

                <!-- CTA Button -->
                <div style="text-align: center; margin: 28px 0;">
                  <a href="${mediaLink}"
                     style="display: inline-block; padding: 14px 36px; background: #6c5ce7;
                            color: white; text-decoration: none; border-radius: 8px;
                            font-weight: 600; font-size: 16px;">
                    📥 Download Your Generation
                  </a>
                </div>

                <p style="color: #888; font-size: 13px; line-height: 1.5;">
                  This link will remain active for 30 days. If you have any questions, just reply to this email.
                </p>
              </div>

              <!-- Footer -->
              <div style="background: #f9f9f9; padding: 20px 24px; text-align: center; border-top: 1px solid #eee;">
                <p style="color: #aaa; font-size: 12px; margin: 0;">
                  © ${new Date().getFullYear()} VibeClipAI · AI-Powered Video Invitations
                </p>
              </div>
            </div>
          </body>
          </html>
        `;
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'VibeClipAI <invitations@vibeclipsai.com>',
        to: [to],
        subject: subject,
        html: emailHtml,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('[SEND-EMAIL] Resend API error:', JSON.stringify(data));
      if (orderId) {
        await client.database
          .from('orders')
          .update({
            email_status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId);
      }
      return new Response(JSON.stringify({ message: 'Resend API rejected the email', details: data }), {
        status: res.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (orderId) {
      await client.database
        .from('orders')
        .update({
          email_status: 'sent',
          email_sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);
    }

    return new Response(JSON.stringify({ success: true, emailId: data.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[SEND-EMAIL] Crash:', String(err));
    return new Response(JSON.stringify({ message: String(err), success: false }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
