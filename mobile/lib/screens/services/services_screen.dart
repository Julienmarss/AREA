import 'package:flutter/material.dart';

class ServicesScreen extends StatelessWidget {
  const ServicesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Services'),
        centerTitle: true,
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Text(
              'Connected Services',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Manage your service connections',
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                color: Theme.of(context).colorScheme.onSurface.withOpacity(0.7),
              ),
            ),
            
            const SizedBox(height: 24),
            
            // Connected Services
            _buildServiceCard(
              context,
              'Gmail',
              'Connected',
              Icons.mail,
              Colors.red,
              true,
            ),
            _buildServiceCard(
              context,
              'Google Drive',
              'Connected',
              Icons.cloud,
              Colors.blue,
              true,
            ),
            _buildServiceCard(
              context,
              'GitHub',
              'Connected',
              Icons.code,
              Colors.black,
              true,
            ),
            _buildServiceCard(
              context,
              'Discord',
              'Connected',
              Icons.chat,
              const Color(0xFF5865F2),
              true,
            ),
            
            const SizedBox(height: 32),
            
            // Available Services
            Text(
              'Available Services',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            
            _buildServiceCard(
              context,
              'Twitter',
              'Not connected',
              Icons.alternate_email,
              Colors.blue,
              false,
            ),
            _buildServiceCard(
              context,
              'Facebook',
              'Not connected',
              Icons.facebook,
              const Color(0xFF1877F2),
              false,
            ),
            _buildServiceCard(
              context,
              'Instagram',
              'Not connected',
              Icons.camera_alt,
              const Color(0xFFE4405F),
              false,
            ),
            _buildServiceCard(
              context,
              'Slack',
              'Not connected',
              Icons.work,
              const Color(0xFF4A154B),
              false,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildServiceCard(
    BuildContext context,
    String name,
    String status,
    IconData icon,
    Color color,
    bool isConnected,
  ) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: color.withOpacity(0.1),
          child: Icon(icon, color: color),
        ),
        title: Text(
          name,
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Text(status),
        trailing: isConnected
            ? Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.check_circle,
                    color: Colors.green,
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  TextButton(
                    onPressed: () {
                      _showDisconnectDialog(context, name);
                    },
                    child: const Text('Disconnect'),
                  ),
                ],
              )
            : ElevatedButton(
                onPressed: () {
                  _showConnectDialog(context, name);
                },
                child: const Text('Connect'),
              ),
      ),
    );
  }

  void _showConnectDialog(BuildContext context, String serviceName) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Connect $serviceName'),
        content: Text('This will open $serviceName authentication in your browser.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              // TODO: Implement OAuth2 connection
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Connecting to $serviceName...'),
                  backgroundColor: Colors.blue,
                ),
              );
            },
            child: const Text('Connect'),
          ),
        ],
      ),
    );
  }

  void _showDisconnectDialog(BuildContext context, String serviceName) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Disconnect $serviceName'),
        content: Text('Are you sure you want to disconnect from $serviceName?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              // TODO: Implement disconnection
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Disconnected from $serviceName'),
                  backgroundColor: Colors.orange,
                ),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
            ),
            child: const Text('Disconnect'),
          ),
        ],
      ),
    );
  }
}
